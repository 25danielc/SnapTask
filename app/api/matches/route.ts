import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { findSkillsInDescription } from '@/lib/utils/skill-keywords'
import { extractSkillsWithAI, calculateAIMatchScores, isAIAvailable } from '@/lib/ai/matching'
import { calculateDetailedMatches, type MatchBreakdown } from '@/lib/ai/detailed-matching'

interface WorkerWithRate {
  id: string
  title: string
  skills: string[]
  bio?: string
  hourly_rate: number
}

export async function POST(request: Request) {
  try {
    let supabase
    try {
      supabase = await createClient()
    } catch (clientError: any) {
      console.error('Error creating Supabase client:', clientError)
      return NextResponse.json({ 
        error: 'Database connection failed. Please check your Supabase configuration.',
        details: process.env.NODE_ENV === 'development' ? clientError?.message : undefined
      }, { status: 500 })
    }

    let user
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Auth error (non-fatal):', authError)
      }
      user = authUser
    } catch (authError: any) {
      console.error('Error getting user (non-fatal):', authError)
      // Continue without user - matches can still be shown
      user = null
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json({ error: 'Invalid request body. Expected JSON.' }, { status: 400 })
    }

    const { 
      description,
      budget_min,
      budget_max,
      location,
      timeline,
      safety_features,
      transportation_provided,
      requires_license,
      requires_insurance,
      work_environment,
      equipment_provided,
    } = body || {}

    // Validate and clean description
    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }
    
    // Clean the description
    const cleanedDescription = description.trim()

    // Calculate budget from range (use max if available, otherwise min, otherwise null)
    const budget = budget_max || budget_min || null

    // Only create project if user is authenticated
    let project = null
    if (user) {
      const projectInsert: any = {
        client_id: user.id,
        title: 'AI Matched Project',
        description,
        status: 'open',
        budget,
        budget_min: budget_min || null,
        budget_max: budget_max || null,
        location: location || null,
        timeline: timeline || null,
        safety_features: safety_features || null,
        transportation_provided: transportation_provided || false,
        requires_license: requires_license || false,
        requires_insurance: requires_insurance || false,
        work_environment: work_environment || null,
        equipment_provided: equipment_provided || null,
      }

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert(projectInsert)
        .select()
        .single()

      if (projectError) {
        console.error('Error creating project:', projectError)
        // Continue without project if creation fails
      } else {
        project = projectData
      }
    }

    // Extract skills from description - use AI if available, otherwise use keyword matching
    let foundSkills: string[] = []
    const useAI = isAIAvailable()
    
    if (useAI) {
      foundSkills = await extractSkillsWithAI(cleanedDescription)
      // Fallback to keyword matching if AI returns no results
      if (foundSkills.length === 0) {
        foundSkills = findSkillsInDescription(cleanedDescription)
      }
    } else {
      foundSkills = findSkillsInDescription(cleanedDescription)
    }

    // Get or create skills and link to project (if project exists)
    const skillIds: string[] = []
    const { data: allSkills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name')

    if (skillsError) {
      console.error('Error fetching skills:', skillsError)
      
      // Check if it's a Supabase server down error (521 or HTML response)
      const errorMessage = skillsError.message || ''
      if (errorMessage.includes('521') || errorMessage.includes('Web server is down') || errorMessage.includes('<!DOCTYPE html>')) {
        return NextResponse.json({ 
          error: 'Supabase project is currently unavailable. Your project may be paused. Please check your Supabase dashboard and restore it if needed.',
          code: 'SUPABASE_DOWN'
        }, { status: 503 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch skills from database',
        details: process.env.NODE_ENV === 'development' ? skillsError.message : undefined
      }, { status: 500 })
    }

    for (const skillName of foundSkills) {
      // Find existing skill (case-insensitive)
      let skill = allSkills?.find(s => s.name.toLowerCase() === skillName.toLowerCase())

      if (!skill) {
        // Create new skill with proper capitalization
        const capitalizedName = skillName
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
        
        const { data: newSkill } = await supabase
          .from('skills')
          .insert({ name: capitalizedName })
          .select()
          .single()
        
        if (newSkill) skill = newSkill
      }

      if (skill && !skillIds.includes(skill.id)) {
        skillIds.push(skill.id)
        // Only link to project if it exists
        if (project) {
          await supabase
            .from('project_skills')
            .insert({ project_id: project.id, skill_id: skill.id })
        }
      }
    }

    // Find matching workers based on skills
    const { data: allWorkers, error: workersError } = await supabase
      .from('workers')
      .select(`
        *,
        profiles(*),
        worker_skills(
          skills(*)
        )
      `)

    if (workersError) {
      console.error('Error fetching workers:', workersError)
      
      // Check if it's a Supabase server down error (521 or HTML response)
      const errorMessage = workersError.message || ''
      if (errorMessage.includes('521') || errorMessage.includes('Web server is down') || errorMessage.includes('<!DOCTYPE html>')) {
        return NextResponse.json({ 
          error: 'Supabase project is currently unavailable. Your project may be paused. Please check your Supabase dashboard and restore it if needed.',
          code: 'SUPABASE_DOWN'
        }, { status: 503 })
      }
      
      throw workersError
    }

    if (!allWorkers || allWorkers.length === 0) {
      return NextResponse.json({ matches: [], project, message: 'No workers found in database' })
    }

    // Calculate match scores and create matches
    const matches = []
    const minMatchScore = 25 // Lower threshold to ensure matches are returned

    // Filter workers by budget range if specified
    let workers = allWorkers
    if (budget_min !== undefined || budget_max !== undefined) {
      workers = workers.filter(worker => {
        const hourlyRate = Number(worker.hourly_rate) || 0
        if (budget_min !== undefined && budget_max !== undefined) {
          return hourlyRate >= budget_min && hourlyRate <= budget_max
        } else if (budget_min !== undefined) {
          return hourlyRate >= budget_min
        } else if (budget_max !== undefined) {
          return hourlyRate <= budget_max
        }
        return true
      })
      
      // If filtering removed all workers, relax the filter slightly
      if (workers.length === 0 && allWorkers.length > 0) {
        console.log('Budget filter removed all workers, relaxing filter...')
        if (budget_min !== undefined) {
          workers = allWorkers.filter(worker => {
            const hourlyRate = Number(worker.hourly_rate) || 0
            return hourlyRate >= budget_min * 0.85 // Allow 15% below minimum
          })
        } else {
          workers = allWorkers // Use all workers if no minimum
        }
      }
    }

    // Prepare worker profiles for AI matching (with hourly_rate)
    const workerProfiles = workers.map(worker => {
      const workerSkills = (worker.worker_skills || [])
        .map((ws: any) => ws.skills?.name)
        .filter(Boolean)
      
      const profile = Array.isArray(worker.profiles) ? worker.profiles[0] : worker.profiles
      
      return {
        id: worker.id,
        title: worker.title || '',
        skills: workerSkills,
        bio: profile?.bio || '',
        hourly_rate: Number(worker.hourly_rate) || 0
      }
    })

    // Prioritize AI matching if available, otherwise use detailed algorithmic matching
    let aiMatchScores: Map<string, number> = new Map()
    let useAIPrimary = false
    
    if (useAI && workerProfiles.length > 0) {
      try {
        const aiResults = await calculateAIMatchScores(
          cleanedDescription, 
          workerProfiles,
          budget_min,
          budget_max
        )
        aiResults.forEach(result => {
          aiMatchScores.set(result.workerId, result.matchScore)
        })
        useAIPrimary = true
      } catch (error) {
        console.error('Error calculating AI match scores, falling back to algorithmic matching:', error)
        useAIPrimary = false
      }
    }

    // Calculate detailed matching scores for breakdowns (used even with AI for transparency)
    const detailedMatches = calculateDetailedMatches(
      workerProfiles,
      cleanedDescription,
      foundSkills,
      budget_min,
      budget_max
    )

    for (const worker of workers) {
      // Get detailed breakdown for this worker (for UI display)
      const breakdown = detailedMatches.get(worker.id)
      
      if (!breakdown) {
        continue // Skip if no breakdown (shouldn't happen)
      }

      // Use AI score as primary if available, otherwise use algorithmic matching
      let matchScore: number
      if (useAIPrimary && aiMatchScores.has(worker.id)) {
        // Use AI score as primary (85%), blend with algorithmic for consistency (15%)
        const aiScore = aiMatchScores.get(worker.id) || 0
        const algorithmicScore = breakdown.overall
        matchScore = Math.round(aiScore * 0.85 + algorithmicScore * 0.15)
        
        // Update breakdown with AI score for transparency
        breakdown.overall = matchScore
      } else {
        // Fallback to algorithmic matching if AI not available
        matchScore = breakdown.overall
      }

      // Create match if score meets threshold
      if (matchScore >= minMatchScore) {
        // Only create match in database if project exists
        // All matches start as 'pending' - workers can accept or decline
        let match = null
        if (project) {
          const { data: matchData, error: matchError } = await supabase
            .from('matches')
            .insert({
              project_id: project.id,
              worker_id: worker.id,
              match_score: matchScore,
              status: 'pending',
            })
            .select()
            .single()

          if (matchError) {
            console.error('Error creating match:', matchError)
            // Continue with other workers even if one fails
            continue
          }
          match = matchData

          // Create notification for the worker
          if (worker.user_id) {
            await supabase
              .from('notifications')
              .insert({
                user_id: worker.user_id,
                match_id: matchData.id,
                type: 'match_created',
                title: 'New Project Match',
                message: `You've been matched with a new project: ${project.title || 'Untitled Project'}`,
              })
          }
        }

        // Add to matches array even if no project (for display purposes)
        matches.push({
          id: match?.id || `temp-${worker.id}`,
          project_id: project?.id || null,
          worker_id: worker.id,
          match_score: matchScore,
          status: 'pending',
          breakdown: breakdown, // Include detailed breakdown
          worker: {
            ...worker,
            profile: Array.isArray(worker.profiles) ? worker.profiles[0] : worker.profiles,
            skills: worker.worker_skills || []
          }
        })
      }
    }

    // Sort matches by score (highest first)
    matches.sort((a, b) => b.match_score - a.match_score)

    // Ensure we return at least some matches if workers exist
    // If no matches meet threshold but we have workers, lower threshold and try again
    if (matches.length === 0 && workers.length > 0) {
      console.log('No matches found with threshold, lowering threshold to ensure results...')
      const relaxedThreshold = 20
      
      for (const worker of workers) {
        // Get detailed breakdown for this worker
        const breakdown = detailedMatches.get(worker.id)
        if (!breakdown) continue
        
        // Use AI score as primary if available, otherwise use algorithmic matching
        let matchScore: number
        if (useAIPrimary && aiMatchScores.has(worker.id)) {
          // Use AI score as primary (85%), blend with algorithmic for consistency (15%)
          const aiScore = aiMatchScores.get(worker.id) || 0
          matchScore = Math.round(aiScore * 0.85 + breakdown.overall * 0.15)
          breakdown.overall = matchScore
        } else {
          matchScore = breakdown.overall
        }

        // Use relaxed threshold
        if (matchScore >= relaxedThreshold) {
          let match = null
          if (project) {
            const { data: matchData, error: matchError } = await supabase
              .from('matches')
              .insert({
                project_id: project.id,
                worker_id: worker.id,
                match_score: matchScore,
                status: 'pending',
              })
              .select()
              .single()

            if (!matchError && matchData) {
              match = matchData
              if (worker.user_id) {
                await supabase
                  .from('notifications')
                  .insert({
                    user_id: worker.user_id,
                    match_id: matchData.id,
                    type: 'match_created',
                    title: 'New Project Match',
                    message: `You've been matched with a new project: ${project.title || 'Untitled Project'}`,
                  })
              }
            }
          }

          matches.push({
            id: match?.id || `temp-${worker.id}`,
            project_id: project?.id || null,
            worker_id: worker.id,
            match_score: matchScore,
            status: 'pending',
            breakdown: breakdown, // Include detailed breakdown
            worker: {
              ...worker,
              profile: Array.isArray(worker.profiles) ? worker.profiles[0] : worker.profiles,
              skills: worker.worker_skills || []
            }
          })
        }
      }
      
      // Re-sort with relaxed matches
      matches.sort((a, b) => b.match_score - a.match_score)
    }

    // If still no matches and we have workers, return top 3-5 workers with best fallback scores
    if (matches.length === 0 && workers.length > 0) {
      console.log('Still no matches, returning best available workers...')
      // Sort workers by their detailed match scores
      const sortedWorkers = workers
        .map(worker => ({
          worker,
          breakdown: detailedMatches.get(worker.id)
        }))
        .filter(({ breakdown }) => breakdown !== undefined)
        .sort((a, b) => (b.breakdown?.overall || 0) - (a.breakdown?.overall || 0))
        .slice(0, Math.min(5, workers.length))
      
      const fallbackMatches = sortedWorkers.map(({ worker, breakdown }) => {
        return {
          id: `fallback-${worker.id}`,
          project_id: project?.id || null,
          worker_id: worker.id,
          match_score: breakdown?.overall || 35,
          status: 'pending',
          breakdown: breakdown, // Include detailed breakdown
          worker: {
            ...worker,
            profile: Array.isArray(worker.profiles) ? worker.profiles[0] : worker.profiles,
            skills: worker.worker_skills || []
          }
        }
      })
      
      matches.push(...fallbackMatches)
    }

    return NextResponse.json({ matches, project })
  } catch (error: any) {
    console.error('Matches API error:', error)
    
    // Check if it's a network/database connection error
    let errorMessage = error?.message || 'An unexpected error occurred while finding matches'
    let statusCode = error?.status || 500
    
    // Provide more specific error messages
    const errorMsg = error?.message || ''
    if (errorMsg.includes('521') || errorMsg.includes('Web server is down') || errorMsg.includes('<!DOCTYPE html>')) {
      errorMessage = 'Supabase project is currently unavailable. Your project may be paused. Please check your Supabase dashboard and restore it if needed.'
      statusCode = 503
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Database connection failed. Please check your Supabase configuration and network connection.'
      statusCode = 503
    } else if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      errorMessage = 'Cannot connect to database. Please verify your Supabase URL is correct.'
      statusCode = 503
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (error?.stack || error?.message) : undefined,
      type: error?.constructor?.name
    }, { status: statusCode })
  }
}

