import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {}
  }

  // Check 1: Environment variables
  diagnostics.checks.env = {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...` 
      : 'missing'
  }

  // Check 2: Supabase client creation
  try {
    const supabase = await createClient()
    diagnostics.checks.clientCreation = { success: true }
    
    // Check 3: Auth check
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      diagnostics.checks.auth = {
        success: true,
        hasUser: !!user,
        error: authError?.message || null
      }
    } catch (authErr: any) {
      diagnostics.checks.auth = {
        success: false,
        error: authErr?.message || 'Unknown auth error'
      }
    }

    // Check 4: Database query - skills table
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('id, name')
        .limit(1)
      
      diagnostics.checks.skillsQuery = {
        success: !error,
        error: error?.message || null,
        hasData: !!data
      }
    } catch (queryErr: any) {
      diagnostics.checks.skillsQuery = {
        success: false,
        error: queryErr?.message || 'Unknown query error',
        type: queryErr?.constructor?.name
      }
    }

    // Check 5: Database query - workers table
    try {
      const { data, error } = await supabase
        .from('workers')
        .select('id')
        .limit(1)
      
      diagnostics.checks.workersQuery = {
        success: !error,
        error: error?.message || null,
        hasData: !!data
      }
    } catch (queryErr: any) {
      diagnostics.checks.workersQuery = {
        success: false,
        error: queryErr?.message || 'Unknown query error',
        type: queryErr?.constructor?.name
      }
    }

  } catch (clientErr: any) {
    diagnostics.checks.clientCreation = {
      success: false,
      error: clientErr?.message || 'Unknown error',
      type: clientErr?.constructor?.name,
      stack: clientErr?.stack
    }
  }

  const allChecksPass = Object.values(diagnostics.checks).every(
    (check: any) => check.success !== false
  )

  return NextResponse.json({
    ...diagnostics,
    overall: allChecksPass ? 'healthy' : 'issues_detected'
  }, { 
    status: allChecksPass ? 200 : 500 
  })
}

