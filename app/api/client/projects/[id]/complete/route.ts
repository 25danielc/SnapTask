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

    // Get project and verify ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, client_id, status')
      .eq('id', id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.client_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update project status to completed
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating project:', updateError)
      return NextResponse.json({ error: 'Failed to complete project' }, { status: 500 })
    }

    // Update all accepted matches for this project to completed
    const { error: matchesError } = await supabase
      .from('matches')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('project_id', id)
      .eq('status', 'accepted')

    if (matchesError) {
      console.error('Error updating matches:', matchesError)
      // Don't fail the request if match update fails
    }

    return NextResponse.json({ success: true, message: 'Project marked as completed' })
  } catch (error: any) {
    console.error('Complete project API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

