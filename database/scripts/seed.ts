/**
 * Seed script to populate the database with initial data
 * Run this after setting up your Supabase database
 * 
 * Usage: npx tsx database/scripts/seed.ts
 * Or: node --loader ts-node/esm database/scripts/seed.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seed() {
  console.log('🌱 Starting seed...')

  // Create skills
  const skills = [
    'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust',
    'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Redis',
    'Figma', 'Design Systems', 'Prototyping', 'UI/UX', 'Frontend', 'Backend', 'Full-Stack',
    'Machine Learning', 'AI', 'TensorFlow', 'PyTorch', 'Data Science',
    'Blockchain', 'Solidity', 'Web3', 'Smart Contracts',
    'Mobile', 'iOS', 'Android', 'React Native', 'Flutter'
  ]

  console.log('Creating skills...')
  const skillInserts = await Promise.all(
    skills.map(skill => 
      supabase.from('skills').upsert({ name: skill }, { onConflict: 'name' })
    )
  )

  // Get skill IDs
  const { data: allSkills } = await supabase.from('skills').select('id, name')
  const skillMap = new Map(allSkills?.map(s => [s.name, s.id]) || [])

  console.log(`✅ Created ${skills.length} skills`)

  // Note: To create workers, you'll need actual user accounts
  // This is just a template - you'll need to create users first
  console.log('📝 Note: To create workers, you need to:')
  console.log('   1. Sign up users through the app')
  console.log('   2. Create worker profiles for those users')
  console.log('   3. Add skills to worker profiles')

  console.log('✅ Seed completed!')
}

seed().catch(console.error)

