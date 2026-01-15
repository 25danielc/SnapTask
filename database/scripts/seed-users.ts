/**
 * Seed script to create 5 test users with different expertise
 * Run with: npx tsx database/scripts/seed-users.ts
 * 
 * Make sure you have SUPABASE_SERVICE_ROLE_KEY in your .env.local
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
  console.error('\nGet service_role key from: Supabase Dashboard > Settings > API > service_role key')
  console.error('\nDebug info:')
  console.error('  URL found:', supabaseUrl ? '✅' : '❌')
  console.error('  Service key found:', supabaseServiceKey ? '✅' : '❌')
  console.error('  Loaded env vars:', Object.keys(env).length, 'variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testUsers = [
  {
    email: 'sarah.chen@example.com',
    password: 'testpassword123',
    full_name: 'Sarah Chen',
    title: 'Senior Full-Stack Developer',
    hourly_rate: 95,
    availability: 'Available Now',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker'],
    bio: 'Experienced full-stack developer with 8+ years building scalable web applications. Specialized in modern JavaScript frameworks and cloud infrastructure.',
    image: '/professional-woman-diverse.png'
  },
  {
    email: 'mike.farmer@example.com',
    password: 'testpassword123',
    full_name: 'Mike Thompson',
    title: 'Organic Farming Consultant',
    hourly_rate: 65,
    availability: 'Available in 2 days',
    skills: ['Organic Farming', 'Crop Rotation', 'Soil Management', 'Sustainable Agriculture', 'Livestock Care'],
    bio: 'Third-generation farmer with expertise in organic and sustainable farming practices. Helping farms transition to eco-friendly methods.',
    image: '/professional-man.jpg'
  },
  {
    email: 'joe.plumber@example.com',
    password: 'testpassword123',
    full_name: 'Joe Martinez',
    title: 'Licensed Master Plumber',
    hourly_rate: 85,
    availability: 'Available Now',
    skills: ['Pipe Installation', 'Leak Repair', 'Water Heater Installation', 'Drain Cleaning', 'Emergency Plumbing'],
    bio: '20+ years of plumbing experience. Licensed and insured. Available for residential and commercial projects.',
    image: '/professional-man-beard.png'
  },
  {
    email: 'vibe.coder@example.com',
    password: 'testpassword123',
    full_name: 'Alex Rivera',
    title: 'Vibe Coding Specialist',
    hourly_rate: 120,
    availability: 'Available Now',
    skills: ['Vibe Coding', 'Code Aesthetics', 'Developer Experience', 'Code Flow', 'Programming Vibes'],
    bio: 'Specializing in writing code that not only works but feels good. Expert in creating beautiful, maintainable codebases with excellent developer experience.',
    image: '/professional-asian-man.png'
  },
  {
    email: 'dr.smith@example.com',
    password: 'testpassword123',
    full_name: 'Dr. Emily Smith',
    title: 'General Practitioner',
    hourly_rate: 150,
    availability: 'Available in 1 week',
    skills: ['General Medicine', 'Health Consultation', 'Medical Diagnosis', 'Preventive Care', 'Patient Care'],
    bio: 'Board-certified physician with 10+ years of experience. Providing comprehensive medical consultations and health advice.',
    image: '/professional-woman-glasses.png'
  }
]

async function seed() {
  console.log('🌱 Starting seed process...\n')

  // First, ensure skills exist
  console.log('📚 Creating/verifying skills...')
  const allSkills = new Set<string>()
  testUsers.forEach(user => {
    user.skills.forEach(skill => allSkills.add(skill))
  })

  const skillMap = new Map<string, string>()
  for (const skillName of Array.from(allSkills)) {
    // Check if skill exists - use maybeSingle() to avoid errors when not found
    let { data: existingSkill, error: fetchError } = await supabase
      .from('skills')
      .select('id')
      .eq('name', skillName)
      .maybeSingle()

    if (fetchError) {
      console.error(`❌ Error fetching skill ${skillName}:`, fetchError.message)
      continue
    }

    if (!existingSkill) {
      // Create skill
      const { data: newSkill, error } = await supabase
        .from('skills')
        .insert({ name: skillName })
        .select()
        .single()

      if (error) {
        console.error(`❌ Error creating skill ${skillName}:`, error.message)
        continue
      }
      existingSkill = newSkill
    }

    if (existingSkill) {
      skillMap.set(skillName, existingSkill.id)
      console.log(`  ✅ ${skillName}`)
    }
  }

  console.log(`\n👥 Creating ${testUsers.length} users...\n`)

  for (const userData of testUsers) {
    try {
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name
        }
      })

      if (authError) {
        // User might already exist
        if (authError.message.includes('already registered')) {
          console.log(`⚠️  User ${userData.email} already exists, skipping...`)
          continue
        }
        throw authError
      }

      if (!authUser.user) {
        console.error(`❌ Failed to create user ${userData.email}`)
        continue
      }

      const userId = authUser.user.id

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: userData.email,
          full_name: userData.full_name,
          bio: userData.bio,
          avatar_url: userData.image
        })

      if (profileError) {
        console.error(`❌ Error creating profile for ${userData.email}:`, profileError.message)
        continue
      }

      // Create worker profile
      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .insert({
          user_id: userId,
          title: userData.title,
          hourly_rate: userData.hourly_rate,
          availability: userData.availability,
          image_url: userData.image,
          rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
          reviews_count: Math.floor(Math.random() * 100) + 20 // Random reviews 20-120
        })
        .select()
        .single()

      if (workerError) {
        console.error(`❌ Error creating worker for ${userData.email}:`, workerError.message)
        continue
      }

      // Add skills to worker
      const workerSkills = userData.skills
        .map(skillName => {
          const skillId = skillMap.get(skillName)
          return skillId ? {
            worker_id: worker.id,
            skill_id: skillId
          } : null
        })
        .filter((ws): ws is { worker_id: string; skill_id: string } => ws !== null) // Remove any missing skills

      if (workerSkills.length > 0) {
        const { error: skillsError } = await supabase
          .from('worker_skills')
          .insert(workerSkills)

        if (skillsError) {
          console.error(`❌ Error adding skills for ${userData.email}:`, skillsError.message)
        }
      }

      console.log(`✅ Created: ${userData.full_name} (${userData.title})`)
      console.log(`   Email: ${userData.email} | Password: ${userData.password}`)
    } catch (error: any) {
      console.error(`❌ Error creating ${userData.email}:`, error.message)
    }
  }

  console.log('\n✨ Seed completed!')
  console.log('\n📝 Test credentials:')
  testUsers.forEach(user => {
    console.log(`   ${user.email} / ${user.password}`)
  })
}

seed().catch(console.error)

