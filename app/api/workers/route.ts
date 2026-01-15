import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { transformWorkerData } from '@/lib/utils/worker-data'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const skill = searchParams.get('skill')
    const availability = searchParams.get('availability')

    // Query workers with related data
    // Try multiple relationship syntaxes for compatibility
    let query = supabase
      .from('workers')
      .select(`
        *,
        profiles(*),
        worker_skills(
          skills(*)
        )
      `)
      .order('rating', { ascending: false })

    if (search) {
      query = query.or(`title.ilike.%${search}%`)
    }

    if (availability) {
      query = query.eq('availability', availability)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error fetching workers:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      // Return empty array instead of error to prevent UI breaking
      // Log the error for debugging
      return NextResponse.json([], { status: 200 })
    }

    // If no data, return empty array
    if (!data || data.length === 0) {
      console.log('No workers found in database')
      return NextResponse.json([])
    }

    console.log(`Found ${data.length} workers in database`)

    // Transform data using helper function
    // Don't filter - let all workers through, even if some data is missing
    const transformedData = data.map(transformWorkerData)

    console.log(`Transformed ${transformedData.length} valid workers`)

    // Filter by skill if provided
    const filteredData = skill
      ? transformedData.filter(worker =>
          worker.skills.some(skillName => 
            skillName.toLowerCase().includes(skill.toLowerCase())
          )
        )
      : transformedData

    const response = NextResponse.json(filteredData)
    
    // Cache workers list for 60 seconds (less frequently changing)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    
    return response
  } catch (error: any) {
    console.error('API error:', error)
    // Return empty array instead of error to prevent UI breaking
    return NextResponse.json([], { status: 200 })
  }
}

