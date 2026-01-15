import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        supabaseUrl: supabaseUrl ? '✅ Set' : '❌ Missing',
        supabaseKey: supabaseKey ? '✅ Set' : '❌ Missing',
        instructions: 'Create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      }, { status: 500 })
    }
    
    let supabase
    try {
      supabase = await createClient()
    } catch (clientError: any) {
      return NextResponse.json({
        error: 'Failed to create Supabase client',
        clientError: clientError.message,
        stack: clientError.stack
      }, { status: 500 })
    }
    
    // Test connection first
    let connectionTest
    try {
      const testResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      })
      connectionTest = {
        status: testResponse.status,
        statusText: testResponse.statusText,
        ok: testResponse.ok
      }
    } catch (fetchError: any) {
      connectionTest = {
        error: fetchError.message,
        type: fetchError.constructor.name
      }
    }
    
    // Test 1: Simple workers query
    let simpleWorkers, simpleError
    try {
      const result = await supabase
        .from('workers')
        .select('*')
        .limit(5)
      simpleWorkers = result.data
      simpleError = result.error
    } catch (queryError: any) {
      simpleError = {
        message: queryError.message,
        type: queryError.constructor.name,
        stack: queryError.stack
      }
    }
    
    // Test 2: Workers with profiles
    const { data: workersWithProfiles, error: profilesError } = await supabase
      .from('workers')
      .select(`
        *,
        profiles(*)
      `)
      .limit(5)
    
    // Test 3: Full query
    const { data: fullWorkers, error: fullError } = await supabase
      .from('workers')
      .select(`
        *,
        profiles(*),
        worker_skills(
          skills(*)
        )
      `)
      .limit(5)
    
    // Test 4: Check profiles directly
    const { data: profiles, error: profilesTableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    return NextResponse.json({
      env: {
        supabaseUrl: supabaseUrl ? '✅ Set' : '❌ Missing',
        supabaseKey: supabaseKey ? '✅ Set' : '❌ Missing',
        urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'N/A'
      },
      connectionTest: connectionTest,
      simple: {
        count: simpleWorkers?.length || 0,
        error: simpleError?.message || (typeof simpleError === 'object' ? simpleError : null),
        errorCode: simpleError?.code || null,
        errorType: typeof simpleError === 'object' && simpleError?.type || null,
        sample: simpleWorkers?.[0] || null
      },
      withProfiles: {
        count: workersWithProfiles?.length || 0,
        error: profilesError?.message || null,
        errorCode: profilesError?.code || null,
        sample: workersWithProfiles?.[0] || null
      },
      full: {
        count: fullWorkers?.length || 0,
        error: fullError?.message || null,
        errorCode: fullError?.code || null,
        sample: fullWorkers?.[0] || null
      },
      profiles: {
        count: profiles?.length || 0,
        error: profilesTableError?.message || null,
        errorCode: profilesTableError?.code || null,
        sample: profiles?.[0] || null
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    }, { status: 500 })
  }
}

