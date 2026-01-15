/**
 * Script to update all existing workers with profile images
 * This assigns images to workers that don't have them yet
 * 
 * Run with: npx tsx database/scripts/update-worker-images.ts
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
    console.error('Could not load .env.local file:', error)
    return {}
  }
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Please add to .env.local:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Available profile images to cycle through
const profileImages = [
  '/professional-woman-diverse.png',
  '/professional-man.jpg',
  '/professional-man-beard.png',
  '/professional-asian-man.png',
  '/professional-woman-glasses.png',
  '/professional-woman-smile.jpg'
]

// Helper function to get image for a worker (cycles through available images)
function getImageForWorker(index: number): string {
  return profileImages[index % profileImages.length]
}

async function updateWorkerImages() {
  console.log('🖼️  Updating worker images...\n')

  // Get all workers with their profiles
  const { data: workers, error: workersError } = await supabase
    .from('workers')
    .select(`
      id,
      user_id,
      image_url,
      profiles!inner(
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: true })

  if (workersError) {
    console.error('❌ Error fetching workers:', workersError.message)
    process.exit(1)
  }

  if (!workers || workers.length === 0) {
    console.log('⚠️  No workers found in database')
    return
  }

  console.log(`Found ${workers.length} workers\n`)

  let updatedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (let i = 0; i < workers.length; i++) {
    const worker = workers[i]
    const workerImage = getImageForWorker(i)
    const profile = Array.isArray(worker.profiles) ? worker.profiles[0] : worker.profiles

    try {
      // Check if worker already has an image
      if (worker.image_url && worker.image_url !== '/placeholder.svg' && worker.image_url !== '/placeholder-user.jpg') {
        console.log(`⏭️  Skipping ${profile?.full_name || profile?.email || 'Unknown'} - already has image`)
        skippedCount++
        continue
      }

      // Update worker image_url
      const { error: workerUpdateError } = await supabase
        .from('workers')
        .update({ image_url: workerImage })
        .eq('id', worker.id)

      if (workerUpdateError) {
        console.error(`❌ Error updating worker ${worker.id}:`, workerUpdateError.message)
        errorCount++
        continue
      }

      // Update profile avatar_url
      if (profile?.id) {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ avatar_url: workerImage })
          .eq('id', profile.id)

        if (profileUpdateError) {
          console.error(`❌ Error updating profile ${profile.id}:`, profileUpdateError.message)
          // Don't count this as a full error since worker was updated
        }
      }

      console.log(`✅ Updated: ${profile?.full_name || profile?.email || 'Unknown'} with ${workerImage}`)
      updatedCount++
    } catch (error: any) {
      console.error(`❌ Error processing worker ${worker.id}:`, error.message)
      errorCount++
    }
  }

  console.log('\n✨ Update completed!')
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Updated: ${updatedCount}`)
  console.log(`   ⏭️  Skipped (already has image): ${skippedCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
}

updateWorkerImages().catch(console.error)

