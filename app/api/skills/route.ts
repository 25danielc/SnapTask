import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('skills')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching skills:', error)
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 })
    }

    return NextResponse.json({ skills: data || [] })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

