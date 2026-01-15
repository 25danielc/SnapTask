/**
 * Test script to check if workers are in the database
 * Run with: npx tsx database/scripts/test-workers.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load .env.local manually
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local')
    const envFile = readFileSync(envPath, 'utf-8')
    const envVars: Record<string, string> = {}
    
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim()
        }
      }
    })
    
    return envVars
  } catch (error) {
    console.error('Could not load .env.local file')
    return {}
  }
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('Make sure .env.local has:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL')
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('\nTrying to load from .env.local...')
  console.error('Loaded URL:', supabaseUrl ? '✅' : '❌')
  console.error('Loaded Key:', supabaseKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testWorkers() {
  console.log('🔍 Testing workers query...\n')

  // Test 1: Simple workers query
  console.log('1. Testing simple workers query...')
  const { data: workers, error: workersError } = await supabase
    .from('workers')
    .select('*')
    .limit(5)

  if (workersError) {
    console.error('❌ Error:', workersError.message)
  } else {
    console.log(`✅ Found ${workers?.length || 0} workers`)
    if (workers && workers.length > 0) {
      console.log('   Sample worker:', {
        id: workers[0].id,
        title: workers[0].title,
        user_id: workers[0].user_id
      })
    }
  }

  // Test 2: Workers with profiles
  console.log('\n2. Testing workers with profiles...')
  const { data: workersWithProfiles, error: profilesError } = await supabase
    .from('workers')
    .select(`
      *,
      profiles(*)
    `)
    .limit(5)

  if (profilesError) {
    console.error('❌ Error:', profilesError.message)
  } else {
    console.log(`✅ Found ${workersWithProfiles?.length || 0} workers with profiles`)
    if (workersWithProfiles && workersWithProfiles.length > 0) {
      const worker = workersWithProfiles[0]
      console.log('   Sample worker with profile:', {
        id: worker.id,
        title: worker.title,
        profile: worker.profiles
      })
    }
  }

  // Test 3: Workers with skills
  console.log('\n3. Testing workers with skills...')
  const { data: workersWithSkills, error: skillsError } = await supabase
    .from('workers')
    .select(`
      *,
      profiles(*),
      worker_skills(
        skills(*)
      )
    `)
    .limit(5)

  if (skillsError) {
    console.error('❌ Error:', skillsError.message)
  } else {
    console.log(`✅ Found ${workersWithSkills?.length || 0} workers with skills`)
    if (workersWithSkills && workersWithSkills.length > 0) {
      const worker = workersWithSkills[0]
      console.log('   Sample worker:', {
        id: worker.id,
        title: worker.title,
        profile_name: Array.isArray(worker.profiles) ? worker.profiles[0]?.full_name : worker.profiles?.full_name,
        skills_count: worker.worker_skills?.length || 0
      })
    }
  }

  // Test 4: Check profiles table
  console.log('\n4. Testing profiles table...')
  const { data: profiles, error: profilesTableError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5)

  if (profilesTableError) {
    console.error('❌ Error:', profilesTableError.message)
  } else {
    console.log(`✅ Found ${profiles?.length || 0} profiles`)
  }

  console.log('\n✨ Test complete!')
}

testWorkers().catch(console.error)

