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

    // Get worker for this user
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (workerError || !worker) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 })
    }

    // Get the match and verify it belongs to this worker
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*, projects(id, client_id, status)')
      .eq('id', id)
      .eq('worker_id', worker.id)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status === 'accepted') {
      return NextResponse.json({ error: 'Match already accepted' }, { status: 400 })
    }

    if (match.status === 'rejected') {
      return NextResponse.json({ error: 'Match was already rejected' }, { status: 400 })
    }

    // Update match status to accepted
    const { error: updateError } = await supabase
      .from('matches')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating match:', updateError)
      return NextResponse.json({ error: 'Failed to accept match' }, { status: 500 })
    }

    // Update project status to in_progress if it's open
    if (match.projects && match.projects.status === 'open') {
      await supabase
        .from('projects')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', match.projects.id)
    }

    // Create notification for the client
    if (match.projects) {
      await supabase
        .from('notifications')
        .insert({
          user_id: match.projects.client_id,
          match_id: id,
          type: 'match_accepted',
          title: 'Worker Accepted Your Project',
          message: `A worker has accepted your project: ${match.projects.title || 'Untitled Project'}`,
        })
    }

    return NextResponse.json({ success: true, message: 'Match accepted successfully' })
  } catch (error: any) {
    console.error('Accept match API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

