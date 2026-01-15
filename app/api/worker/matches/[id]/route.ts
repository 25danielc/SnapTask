import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
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

    // Get match with full project and client details
    const { data: match, error: matchError } = await supabase
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
            avatar_url,
            bio
          ),
          project_skills (
            skills (
              id,
              name
            )
          )
        )
      `)
      .eq('id', id)
      .eq('worker_id', worker.id)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    return NextResponse.json({ match })
  } catch (error: any) {
    console.error('Worker match detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

