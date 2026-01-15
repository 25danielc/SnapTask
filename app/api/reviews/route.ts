import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { worker_id, project_id, rating, comment } = body

    if (!worker_id || !project_id || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Verify project exists and is completed
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, status, client_id')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.client_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (project.status !== 'completed') {
      return NextResponse.json({ error: 'Project must be completed to leave a review' }, { status: 400 })
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('project_id', project_id)
      .eq('client_id', user.id)
      .single()

    if (existingReview) {
      // Update existing review
      const { data: review, error: updateError } = await supabase
        .from('reviews')
        .update({
          rating,
          comment: comment || null,
        })
        .eq('id', existingReview.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating review:', updateError)
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
      }

      // Recalculate worker rating
      await recalculateWorkerRating(worker_id)

      return NextResponse.json({ review, message: 'Review updated successfully' })
    }

    // Create new review
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        worker_id,
        client_id: user.id,
        project_id,
        rating,
        comment: comment || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating review:', insertError)
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    // Recalculate worker rating
    await recalculateWorkerRating(worker_id)

    return NextResponse.json({ review, message: 'Review created successfully' })
  } catch (error: any) {
    console.error('Review API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function recalculateWorkerRating(workerId: string) {
  const supabase = await createClient()
  
  // Get all reviews for this worker
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('worker_id', workerId)

  if (error || !reviews || reviews.length === 0) {
    return
  }

  // Calculate average rating
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  // Update worker rating and review count
  await supabase
    .from('workers')
    .update({
      rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      reviews_count: reviews.length,
      updated_at: new Date().toISOString()
    })
    .eq('id', workerId)
}

