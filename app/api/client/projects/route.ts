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

    // Get all projects for this client with matches
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        *,
        matches(
          id,
          status,
          match_score,
          created_at,
          worker_id,
          workers(
            id,
            title,
            hourly_rate,
            profiles(
              id,
              full_name,
              email,
              avatar_url
            )
          )
        )
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    const response = NextResponse.json({ projects: projects || [] })
    
    // Cache for 30 seconds to speed up navigation
    response.headers.set('Cache-Control', 'private, s-maxage=30, stale-while-revalidate=60')
    
    return response
  } catch (error: any) {
    console.error('Client projects API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

