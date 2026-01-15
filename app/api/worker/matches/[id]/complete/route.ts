import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get worker profile
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (workerError || !worker) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 })
    }

    // Get match and verify it belongs to this worker
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*, projects(id, client_id, status)')
      .eq('id', id)
      .eq('worker_id', worker.id)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Only allow completing if match is accepted
    if (match.status !== 'accepted') {
      return NextResponse.json({ 
        error: 'Only accepted matches can be marked as complete' 
      }, { status: 400 })
    }

    // Update match status to completed
    const { error: matchUpdateError } = await supabase
      .from('matches')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (matchUpdateError) {
      console.error('Error updating match:', matchUpdateError)
      return NextResponse.json({ error: 'Failed to complete match' }, { status: 500 })
    }

    // Check if all accepted matches for this project are completed
    const { data: allMatches, error: allMatchesError } = await supabase
      .from('matches')
      .select('id, status')
      .eq('project_id', match.projects.id)
      .in('status', ['accepted', 'completed'])

    if (!allMatchesError && allMatches) {
      const allCompleted = allMatches.every(m => m.status === 'completed')
      
      // If all accepted matches are completed, mark project as completed
      if (allCompleted && match.projects.status === 'in_progress') {
        const { error: projectUpdateError } = await supabase
          .from('projects')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', match.projects.id)

        if (projectUpdateError) {
          console.error('Error updating project:', projectUpdateError)
          // Don't fail the request if project update fails
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Project marked as completed' 
    })
  } catch (error: any) {
    console.error('Complete match API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

