import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
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

    // Get all matches for this worker with project and client details
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        projects (
          id,
          title,
          description,
          budget,
          budget_min,
          budget_max,
          status,
          location,
          timeline,
          safety_features,
          transportation_provided,
          requires_license,
          requires_insurance,
          work_environment,
          equipment_provided,
          created_at,
          client:profiles!projects_client_id_fkey (
            id,
            full_name,
            email,
            avatar_url
          )
        )
      `)
      .eq('worker_id', worker.id)
      .order('created_at', { ascending: false })

    if (matchesError) {
      console.error('Error fetching matches:', matchesError)
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
    }

    const response = NextResponse.json({ matches: matches || [] })
    
    // Cache matches for 15 seconds (frequently accessed)
    response.headers.set('Cache-Control', 'private, s-maxage=15, stale-while-revalidate=30')
    
    return response
  } catch (error: any) {
    console.error('Worker matches API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

