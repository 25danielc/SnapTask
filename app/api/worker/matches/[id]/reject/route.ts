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
      .select('*, projects(id, client_id, title)')
      .eq('id', id)
      .eq('worker_id', worker.id)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status === 'rejected') {
      return NextResponse.json({ error: 'Match already rejected' }, { status: 400 })
    }

    if (match.status === 'accepted') {
      return NextResponse.json({ error: 'Cannot reject an accepted match' }, { status: 400 })
    }

    // Update match status to rejected
    const { error: updateError } = await supabase
      .from('matches')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating match:', updateError)
      return NextResponse.json({ error: 'Failed to reject match' }, { status: 500 })
    }

    // Create notification for the client
    if (match.projects) {
      await supabase
        .from('notifications')
        .insert({
          user_id: match.projects.client_id,
          match_id: id,
          type: 'match_rejected',
          title: 'Worker Rejected Your Project',
          message: `A worker has rejected your project: ${match.projects.title || 'Untitled Project'}`,
        })
    }

    return NextResponse.json({ success: true, message: 'Match rejected successfully' })
  } catch (error: any) {
    console.error('Reject match API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

