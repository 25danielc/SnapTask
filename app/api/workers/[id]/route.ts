import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { transformWorkerData } from '@/lib/utils/worker-data'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get worker with related data
    const { data: worker, error } = await supabase
      .from('workers')
      .select(`
        *,
        profiles(*),
        worker_skills(
          skills(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
    }

    // Get reviews for this worker
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        *,
        client:profiles!reviews_client_id_fkey(
          id,
          full_name,
          email,
          avatar_url
        ),
        projects(
          id,
          title
        )
      `)
      .eq('worker_id', id)
      .order('created_at', { ascending: false })

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError)
    }

    const transformedWorker = transformWorkerData(worker)

    return NextResponse.json({
      worker: transformedWorker,
      reviews: reviews || []
    })
  } catch (error: any) {
    console.error('Worker detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

