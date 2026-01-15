/**
 * Seed script to add more workers for testing
 * - 20 tech workers (college students/recent grads from UMich and Bay Area schools)
 * - 10 gardening specialists
 * 
 * Run with: npx tsx database/scripts/seed-more-workers.ts
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

// Tech workers from University of Michigan and Bay Area schools
const techWorkers = [
  {
    email: 'jordan.kim@umich.edu',
    password: 'testpassword123',
    full_name: 'Jordan Kim',
    title: 'Computer Science Student - Full-Stack Developer',
    hourly_rate: 45,
    availability: 'Available Now',
    skills: ['React', 'Node.js', 'Python', 'JavaScript', 'MongoDB'],
    bio: 'CS junior at University of Michigan. Passionate about web development and building scalable applications. Looking for freelance projects.',
    school: 'University of Michigan'
  },
  {
    email: 'emma.zhang@stanford.edu',
    password: 'testpassword123',
    full_name: 'Emma Zhang',
    title: 'Recent CS Graduate - Frontend Developer',
    hourly_rate: 55,
    availability: 'Available in 2 hours',
    skills: ['React', 'TypeScript', 'Next.js', 'UI/UX', 'Figma'],
    bio: 'Stanford CS graduate specializing in frontend development. Experienced in React and modern UI frameworks. Available for contract work.',
    school: 'Stanford University'
  },
  {
    email: 'marcus.rodriguez@berkeley.edu',
    password: 'testpassword123',
    full_name: 'Marcus Rodriguez',
    title: 'EECS Student - Backend Developer',
    hourly_rate: 50,
    availability: 'Available Now',
    skills: ['Python', 'Java', 'PostgreSQL', 'AWS', 'Docker'],
    bio: 'EECS student at UC Berkeley. Strong background in backend systems and cloud infrastructure. Open to part-time projects.',
    school: 'UC Berkeley'
  },
  {
    email: 'sophia.patel@umich.edu',
    password: 'testpassword123',
    full_name: 'Sophia Patel',
    title: 'Software Engineering Student - Mobile Developer',
    hourly_rate: 48,
    availability: 'Available in 1 day',
    skills: ['React Native', 'iOS', 'Swift', 'Flutter', 'Mobile'],
    bio: 'University of Michigan student studying software engineering. Focus on mobile app development for iOS and Android platforms.',
    school: 'University of Michigan'
  },
  {
    email: 'alex.chen@sjsu.edu',
    password: 'testpassword123',
    full_name: 'Alex Chen',
    title: 'Computer Science Student - Full-Stack Developer',
    hourly_rate: 42,
    availability: 'Available Now',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'GraphQL'],
    bio: 'CS student at San Jose State University. Building full-stack applications and learning modern web technologies.',
    school: 'San Jose State University'
  },
  {
    email: 'taylor.brown@umich.edu',
    password: 'testpassword123',
    full_name: 'Taylor Brown',
    title: 'Data Science Student - ML Engineer',
    hourly_rate: 52,
    availability: 'Available in 2 days',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'Data Science', 'Pandas'],
    bio: 'Data science student at UMich working on machine learning projects. Experienced with Python and ML frameworks.',
    school: 'University of Michigan'
  },
  {
    email: 'riley.martinez@stanford.edu',
    password: 'testpassword123',
    full_name: 'Riley Martinez',
    title: 'Recent CS Graduate - DevOps Engineer',
    hourly_rate: 60,
    availability: 'Available Now',
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps'],
    bio: 'Stanford CS grad specializing in DevOps and cloud infrastructure. Experience with AWS, Docker, and Kubernetes.',
    school: 'Stanford University'
  },
  {
    email: 'casey.wilson@berkeley.edu',
    password: 'testpassword123',
    full_name: 'Casey Wilson',
    title: 'EECS Student - Backend Developer',
    hourly_rate: 47,
    availability: 'Available in 2 hours',
    skills: ['Go', 'Python', 'PostgreSQL', 'Redis', 'Microservices'],
    bio: 'EECS student at UC Berkeley. Passionate about building scalable backend systems and distributed systems.',
    school: 'UC Berkeley'
  },
  {
    email: 'dakota.anderson@umich.edu',
    password: 'testpassword123',
    full_name: 'Dakota Anderson',
    title: 'Computer Science Student - Full-Stack Developer',
    hourly_rate: 44,
    availability: 'Available Now',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express'],
    bio: 'CS student at University of Michigan. Building web applications with modern JavaScript frameworks.',
    school: 'University of Michigan'
  },
  {
    email: 'quinn.thompson@sjsu.edu',
    password: 'testpassword123',
    full_name: 'Quinn Thompson',
    title: 'Computer Science Student - Frontend Developer',
    hourly_rate: 40,
    availability: 'Available in 1 day',
    skills: ['React', 'Vue', 'JavaScript', 'CSS', 'HTML'],
    bio: 'CS student at San Jose State. Specializing in frontend development and user interface design.',
    school: 'San Jose State University'
  },
  {
    email: 'morgan.garcia@stanford.edu',
    password: 'testpassword123',
    full_name: 'Morgan Garcia',
    title: 'Recent CS Graduate - Full-Stack Developer',
    hourly_rate: 58,
    availability: 'Available Now',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
    bio: 'Stanford CS graduate with experience in full-stack development. Building scalable web applications.',
    school: 'Stanford University'
  },
  {
    email: 'samuel.lee@umich.edu',
    password: 'testpassword123',
    full_name: 'Samuel Lee',
    title: 'Computer Science Student - Backend Developer',
    hourly_rate: 46,
    availability: 'Available in 2 hours',
    skills: ['Python', 'Django', 'PostgreSQL', 'REST API', 'FastAPI'],
    bio: 'CS student at UMich. Focus on backend development with Python and building robust APIs.',
    school: 'University of Michigan'
  },
  {
    email: 'cameron.white@berkeley.edu',
    password: 'testpassword123',
    full_name: 'Cameron White',
    title: 'EECS Student - Full-Stack Developer',
    hourly_rate: 49,
    availability: 'Available Now',
    skills: ['React', 'Node.js', 'Python', 'PostgreSQL', 'GraphQL'],
    bio: 'EECS student at UC Berkeley. Full-stack developer with experience in React and Python.',
    school: 'UC Berkeley'
  },
  {
    email: 'alexis.harris@umich.edu',
    password: 'testpassword123',
    full_name: 'Alexis Harris',
    title: 'Computer Science Student - Frontend Developer',
    hourly_rate: 43,
    availability: 'Available in 1 day',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'UI/UX'],
    bio: 'CS student at University of Michigan. Passionate about creating beautiful user interfaces and experiences.',
    school: 'University of Michigan'
  },
  {
    email: 'jordan.clark@sjsu.edu',
    password: 'testpassword123',
    full_name: 'Jordan Clark',
    title: 'Computer Science Student - Backend Developer',
    hourly_rate: 41,
    availability: 'Available Now',
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'REST API', 'Microservices'],
    bio: 'CS student at San Jose State. Building backend systems with Java and Spring Boot framework.',
    school: 'San Jose State University'
  },
  {
    email: 'taylor.lewis@stanford.edu',
    password: 'testpassword123',
    full_name: 'Taylor Lewis',
    title: 'Recent CS Graduate - Full-Stack Developer',
    hourly_rate: 57,
    availability: 'Available in 2 days',
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'GraphQL'],
    bio: 'Stanford CS graduate. Full-stack developer experienced with modern web technologies and databases.',
    school: 'Stanford University'
  },
  {
    email: 'riley.young@berkeley.edu',
    password: 'testpassword123',
    full_name: 'Riley Young',
    title: 'EECS Student - Machine Learning Engineer',
    hourly_rate: 53,
    availability: 'Available Now',
    skills: ['Python', 'PyTorch', 'Machine Learning', 'Data Science', 'NLP'],
    bio: 'EECS student at UC Berkeley. Working on ML projects and NLP applications. Available for freelance work.',
    school: 'UC Berkeley'
  },
  {
    email: 'casey.king@umich.edu',
    password: 'testpassword123',
    full_name: 'Casey King',
    title: 'Computer Science Student - Full-Stack Developer',
    hourly_rate: 45,
    availability: 'Available in 2 hours',
    skills: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB'],
    bio: 'CS student at University of Michigan. Building full-stack applications with the MERN stack.',
    school: 'University of Michigan'
  },
  {
    email: 'dakota.wright@sjsu.edu',
    password: 'testpassword123',
    full_name: 'Dakota Wright',
    title: 'Computer Science Student - Mobile Developer',
    hourly_rate: 44,
    availability: 'Available Now',
    skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Mobile'],
    bio: 'CS student at San Jose State. Developing mobile applications for iOS and Android platforms.',
    school: 'San Jose State University'
  },
  {
    email: 'quinn.lopez@stanford.edu',
    password: 'testpassword123',
    full_name: 'Quinn Lopez',
    title: 'Recent CS Graduate - Backend Developer',
    hourly_rate: 59,
    availability: 'Available in 1 day',
    skills: ['Go', 'Python', 'PostgreSQL', 'AWS', 'Microservices'],
    bio: 'Stanford CS graduate. Backend engineer with experience in Go and Python. Building scalable systems.',
    school: 'Stanford University'
  }
]

// Gardening specialists
const gardeningWorkers = [
  {
    email: 'garden.organic@example.com',
    password: 'testpassword123',
    full_name: 'Maria Green',
    title: 'Organic Gardening Specialist',
    hourly_rate: 55,
    availability: 'Available Now',
    skills: ['Organic Gardening', 'Composting', 'Natural Pest Control', 'Heirloom Vegetables', 'Soil Health'],
    bio: 'Certified organic gardening specialist with 15+ years of experience. Expert in sustainable practices and organic vegetable gardening.',
    specialty: 'Organic Gardening'
  },
  {
    email: 'garden.landscape@example.com',
    password: 'testpassword123',
    full_name: 'James Meadows',
    title: 'Landscape Design Specialist',
    hourly_rate: 65,
    availability: 'Available in 2 days',
    skills: ['Landscape Design', 'Garden Planning', 'Plant Selection', 'Hardscaping', 'Garden Maintenance'],
    bio: 'Professional landscape designer specializing in residential and commercial garden design. Creating beautiful, functional outdoor spaces.',
    specialty: 'Landscape Design'
  },
  {
    email: 'garden.vegetable@example.com',
    password: 'testpassword123',
    full_name: 'Rachel Harvest',
    title: 'Vegetable Gardening Expert',
    hourly_rate: 50,
    availability: 'Available Now',
    skills: ['Vegetable Gardening', 'Raised Beds', 'Seasonal Planting', 'Crop Rotation', 'Harvesting'],
    bio: 'Vegetable gardening expert helping families grow their own food. Specializing in raised bed gardens and seasonal planting.',
    specialty: 'Vegetable Gardening'
  },
  {
    email: 'garden.flower@example.com',
    password: 'testpassword123',
    full_name: 'Lily Bloom',
    title: 'Flower Garden Specialist',
    hourly_rate: 58,
    availability: 'Available in 1 day',
    skills: ['Flower Gardening', 'Perennial Gardens', 'Annual Flowers', 'Cut Flowers', 'Garden Design'],
    bio: 'Flower garden specialist with expertise in perennial and annual gardens. Creating stunning flower displays year-round.',
    specialty: 'Flower Gardening'
  },
  {
    email: 'garden.hydroponic@example.com',
    password: 'testpassword123',
    full_name: 'Alex Flow',
    title: 'Hydroponic Gardening Expert',
    hourly_rate: 70,
    availability: 'Available Now',
    skills: ['Hydroponics', 'Indoor Gardening', 'Aquaponics', 'LED Grow Lights', 'Nutrient Systems'],
    bio: 'Hydroponic gardening expert specializing in indoor growing systems. Setting up and maintaining hydroponic gardens.',
    specialty: 'Hydroponic Gardening'
  },
  {
    email: 'garden.herb@example.com',
    password: 'testpassword123',
    full_name: 'Sage Miller',
    title: 'Herb Gardening Specialist',
    hourly_rate: 52,
    availability: 'Available in 2 hours',
    skills: ['Herb Gardening', 'Culinary Herbs', 'Medicinal Herbs', 'Indoor Herbs', 'Herb Drying'],
    bio: 'Herb gardening specialist with expertise in growing culinary and medicinal herbs. Indoor and outdoor herb gardens.',
    specialty: 'Herb Gardening'
  },
  {
    email: 'garden.roses@example.com',
    password: 'testpassword123',
    full_name: 'Rose Garden',
    title: 'Rose Garden Specialist',
    hourly_rate: 60,
    availability: 'Available Now',
    skills: ['Rose Gardening', 'Rose Pruning', 'Disease Control', 'Rose Varieties', 'Rose Care'],
    bio: 'Dedicated rose garden specialist with 20+ years of experience. Expert in rose care, pruning, and disease management.',
    specialty: 'Rose Gardening'
  },
  {
    email: 'garden.japanese@example.com',
    password: 'testpassword123',
    full_name: 'Kenji Zen',
    title: 'Japanese Garden Specialist',
    hourly_rate: 75,
    availability: 'Available in 1 week',
    skills: ['Japanese Gardens', 'Bonsai', 'Zen Gardens', 'Water Features', 'Traditional Design'],
    bio: 'Japanese garden specialist trained in traditional Japanese garden design. Creating serene, contemplative garden spaces.',
    specialty: 'Japanese Gardens'
  },
  {
    email: 'garden.succulent@example.com',
    password: 'testpassword123',
    full_name: 'Cactus Rose',
    title: 'Succulent & Cactus Specialist',
    hourly_rate: 48,
    availability: 'Available Now',
    skills: ['Succulents', 'Cactus Care', 'Desert Plants', 'Drought-Resistant Gardens', 'Container Gardening'],
    bio: 'Succulent and cactus specialist. Expert in low-water gardening and creating beautiful drought-resistant landscapes.',
    specialty: 'Succulent Gardening'
  },
  {
    email: 'garden.permaculture@example.com',
    password: 'testpassword123',
    full_name: 'Forest Green',
    title: 'Permaculture Design Specialist',
    hourly_rate: 68,
    availability: 'Available in 2 days',
    skills: ['Permaculture', 'Sustainable Design', 'Food Forests', 'Water Harvesting', 'Ecosystem Design'],
    bio: 'Permaculture design specialist creating self-sustaining garden ecosystems. Expert in sustainable, regenerative gardening practices.',
    specialty: 'Permaculture'
  }
]

const allWorkers = [...techWorkers, ...gardeningWorkers]

async function seed() {
  console.log('🌱 Starting seed process for additional workers...\n')
  console.log(`📊 Adding ${techWorkers.length} tech workers and ${gardeningWorkers.length} gardening specialists\n`)

  // First, ensure skills exist
  console.log('📚 Creating/verifying skills...')
  const allSkills = new Set<string>()
  allWorkers.forEach(worker => {
    worker.skills.forEach(skill => allSkills.add(skill))
  })

  const skillMap = new Map<string, string>()
  for (const skillName of Array.from(allSkills)) {
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

  console.log(`\n👥 Creating ${allWorkers.length} workers...\n`)

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (let i = 0; i < allWorkers.length; i++) {
    const workerData = allWorkers[i]
    const workerImage = getImageForWorker(i)
    try {
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: workerData.email,
        password: workerData.password,
        email_confirm: true,
        user_metadata: {
          full_name: workerData.full_name
        }
      })

      let userId: string

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          // User already exists, get their ID from profiles table
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', workerData.email)
            .maybeSingle()

          if (!existingProfile) {
            console.log(`⚠️  User ${workerData.email} already exists but profile not found, skipping...`)
            skipCount++
            continue
          }
          userId = existingProfile.id
          console.log(`⚠️  User ${workerData.email} already exists, updating...`)
        } else {
          throw authError
        }
      } else {
        if (!authUser.user) {
          console.error(`❌ Failed to create user ${workerData.email}`)
          errorCount++
          continue
        }
        userId = authUser.user.id
      }

      // Create or update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: workerData.email,
          full_name: workerData.full_name,
          bio: workerData.bio,
          avatar_url: workerImage,
        })

      if (profileError) {
        console.error(`❌ Error creating/updating profile for ${workerData.email}:`, profileError.message)
        errorCount++
        continue
      }

      // Check if worker already exists
      const { data: existingWorker } = await supabase
        .from('workers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      let worker
      if (existingWorker) {
        // Update existing worker with image
        const { data: updatedWorker, error: updateError } = await supabase
          .from('workers')
          .update({
            image_url: workerImage,
            title: workerData.title,
            hourly_rate: workerData.hourly_rate,
            availability: workerData.availability,
          })
          .eq('id', existingWorker.id)
          .select()
          .single()

        if (updateError) {
          console.error(`❌ Error updating worker for ${workerData.email}:`, updateError.message)
          errorCount++
          continue
        }
        worker = updatedWorker
      } else {
        // Create new worker profile
        const { data: newWorker, error: workerError } = await supabase
          .from('workers')
          .insert({
            user_id: userId,
            title: workerData.title,
            hourly_rate: workerData.hourly_rate,
            availability: workerData.availability,
            rating: 4.0 + Math.random() * 1.0, // Random rating between 4.0-5.0
            reviews_count: Math.floor(Math.random() * 50) + 5, // Random reviews 5-55
            image_url: workerImage,
          })
          .select()
          .single()

        if (workerError) {
          console.error(`❌ Error creating worker for ${workerData.email}:`, workerError.message)
          errorCount++
          continue
        }
        worker = newWorker
      }

      // Add skills to worker
      const workerSkills = workerData.skills
        .map(skillName => {
          const skillId = skillMap.get(skillName)
          return skillId ? {
            worker_id: worker.id,
            skill_id: skillId
          } : null
        })
        .filter((ws): ws is { worker_id: string; skill_id: string } => ws !== null)

      if (workerSkills.length > 0) {
        const { error: skillsError } = await supabase
          .from('worker_skills')
          .insert(workerSkills)

        if (skillsError) {
          console.error(`❌ Error adding skills for ${workerData.email}:`, skillsError.message)
        }
      }

      console.log(`✅ Created: ${workerData.full_name} (${workerData.title})`)
      successCount++
    } catch (error: any) {
      console.error(`❌ Error creating ${workerData.email}:`, error.message)
      errorCount++
    }
  }

  console.log('\n✨ Seed completed!')
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Successfully created: ${successCount}`)
  console.log(`   ⚠️  Skipped (already exists): ${skipCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
}

seed().catch(console.error)

