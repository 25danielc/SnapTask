/**
 * Detailed matching logic that assesses each part of worker skills individually
 * Returns breakdown of match scores by category
 */

export interface MatchBreakdown {
  overall: number // 0-100
  skillMatch: number // 0-100
  skillMatchDetails: {
    exactMatches: string[]
    semanticMatches: string[]
    missingSkills: string[]
    extraSkills: string[]
    matchRate: number
  }
  budgetFit: number // 0-100
  budgetDetails: {
    withinRange: boolean
    deviation: number
    hourlyRate: number
    budgetMin?: number
    budgetMax?: number
  }
  experienceMatch: number // 0-100
  experienceDetails: {
    titleRelevance: number
    experienceKeywords: string[]
    requiredLevel?: string
    workerLevel?: string
  }
  bioRelevance: number // 0-100
  bioDetails: {
    keywordsFound: string[]
    relevanceScore: number
  }
  breakdownSummary: string
}

interface ProjectRequirements {
  description: string
  requiredSkills: string[]
  budgetMin?: number
  budgetMax?: number
  requiresExperience?: boolean
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'expert'
}

interface WorkerProfile {
  id: string
  title: string
  skills: string[]
  bio?: string
  hourly_rate: number
}

/**
 * Domain-specific context mappings for better semantic understanding
 */
const domainMappings: Record<string, string[]> = {
  // Food/Culinary domain
  'potato': ['potato peeler', 'potato dishes', 'roasted potatoes', 'potato', 'potatoes', 'culinary', 'food prep', 'cooking', 'chef', 'kitchen'],
  'cooking': ['cooking', 'chef', 'culinary', 'food preparation', 'food prep', 'kitchen', 'baking', 'meal prep'],
  'culinary': ['culinary', 'chef', 'cooking', 'food prep', 'kitchen', 'baking', 'meal preparation'],
  'food': ['food', 'cooking', 'culinary', 'chef', 'kitchen', 'meal', 'dish', 'recipe'],
  
  // Plumbing domain
  'plumbing': ['plumber', 'plumbing', 'pipe', 'drain', 'sink', 'faucet', 'toilet', 'sewer'],
  'plumber': ['plumber', 'plumbing', 'pipe repair', 'drain cleaning', 'sink installation'],
  
  // Technical/Programming
  'development': ['developer', 'programming', 'coding', 'software', 'app', 'web', 'full-stack'],
  'programming': ['programmer', 'developer', 'coding', 'software development', 'programming'],
  
  // Construction
  'construction': ['builder', 'construction', 'carpenter', 'contractor', 'handyman'],
  'carpentry': ['carpenter', 'carpentry', 'woodworking', 'furniture', 'construction'],
  
  // Cleaning
  'cleaning': ['cleaner', 'cleaning', 'housekeeping', 'janitor', 'maintenance'],
  'housekeeping': ['housekeeper', 'housekeeping', 'cleaning', 'maid'],
  
  // Gardening/Landscaping
  'gardening': ['gardener', 'gardening', 'landscaping', 'lawn care', 'planting'],
  'landscaping': ['landscaper', 'landscaping', 'gardening', 'yard work'],
}

/**
 * Extract domain keywords from a string
 */
function extractDomainKeywords(text: string): string[] {
  const lower = text.toLowerCase()
  const keywords: string[] = []
  
  for (const [domain, related] of Object.entries(domainMappings)) {
    if (related.some(term => lower.includes(term))) {
      keywords.push(domain, ...related)
    }
  }
  
  return [...new Set(keywords)]
}

/**
 * Calculate semantic similarity between two strings with domain awareness
 */
function calculateSemanticSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\W+/).filter(Boolean))
  const words2 = new Set(str2.toLowerCase().split(/\W+/).filter(Boolean))
  
  if (words1.size === 0 || words2.size === 0) return 0
  
  // Standard word overlap
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  let similarity = intersection.size / union.size
  
  // Boost for domain matches
  const domain1 = extractDomainKeywords(str1)
  const domain2 = extractDomainKeywords(str2)
  const domainIntersection = domain1.filter(d => domain2.includes(d))
  
  if (domainIntersection.length > 0) {
    similarity = Math.min(1, similarity + 0.3) // Boost by 0.3 for domain matches
  }
  
  return similarity
}

/**
 * Check if two skills are semantically related with enhanced context understanding
 */
function areSkillsRelated(skill1: string, skill2: string): boolean {
  const normalized1 = skill1.toLowerCase().trim()
  const normalized2 = skill2.toLowerCase().trim()
  
  // Exact match
  if (normalized1 === normalized2) return true
  
  // One contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true
  
  // Check for common root words (e.g., "plumbing" and "plumber")
  const words1 = normalized1.split(/\W+/)
  const words2 = normalized2.split(/\W+/)
  const commonWords = words1.filter(w => words2.includes(w) && w.length > 3)
  if (commonWords.length > 0) return true
  
  // Domain-aware matching: check if they share domain context
  const domain1 = extractDomainKeywords(normalized1)
  const domain2 = extractDomainKeywords(normalized2)
  if (domain1.length > 0 && domain2.length > 0) {
    const sharedDomains = domain1.filter(d => domain2.includes(d))
    if (sharedDomains.length > 0) {
      // If they share domain context, they're related
      // Examples: "potato peeler" and "potato dishes" both have "potato" domain
      return true
    }
  }
  
  // Check semantic similarity (lowered threshold for domain matches)
  const similarity = calculateSemanticSimilarity(normalized1, normalized2)
  return similarity > 0.25 // Lower threshold for better matches
}

/**
 * Extract experience level from title
 */
function extractExperienceLevel(title: string): 'junior' | 'mid' | 'senior' | 'expert' | undefined {
  const titleLower = title.toLowerCase()
  if (titleLower.includes('junior') || titleLower.includes('intern') || titleLower.includes('entry')) {
    return 'junior'
  }
  if (titleLower.includes('senior') || titleLower.includes('sr.') || titleLower.includes('lead') || 
      titleLower.includes('principal') || titleLower.includes('head')) {
    return 'senior'
  }
  if (titleLower.includes('expert') || titleLower.includes('master') || titleLower.includes('chief')) {
    return 'expert'
  }
  return 'mid' // Default to mid-level
}

/**
 * Detect required experience level from description
 */
function detectRequiredExperience(description: string): {
  requiresExperience: boolean
  level?: 'junior' | 'mid' | 'senior' | 'expert'
} {
  const descLower = description.toLowerCase()
  const experienceKeywords = {
    junior: ['junior', 'entry', 'intern', 'student', 'beginner', 'trainee'],
    mid: ['mid-level', 'mid level', 'intermediate'],
    senior: ['senior', 'experienced', 'sr.', 'professional', 'seasoned', 'veteran'],
    expert: ['expert', 'master', 'chief', 'lead', 'principal', 'advanced', 'specialist']
  }
  
  // Check for explicit level mentions
  for (const [level, keywords] of Object.entries(experienceKeywords)) {
    if (keywords.some(kw => descLower.includes(kw))) {
      return {
        requiresExperience: true,
        level: level as 'junior' | 'mid' | 'senior' | 'expert'
      }
    }
  }
  
  // Check for general experience requirement
  const generalExperience = descLower.includes('experience') || 
                           descLower.includes('experienced') ||
                           descLower.includes('professional')
  
  return {
    requiresExperience: generalExperience,
    level: generalExperience ? 'mid' : undefined
  }
}

/**
 * Match individual skills between project and worker with enhanced context awareness
 */
function matchSkills(
  requiredSkills: string[],
  workerSkills: string[],
  workerTitle?: string,
  workerBio?: string
): MatchBreakdown['skillMatchDetails'] {
  const exactMatches: string[] = []
  const semanticMatches: string[] = []
  const missingSkills: string[] = []
  const extraSkills: string[] = [...workerSkills]
  
  // Extract domain context from worker's title and bio
  const workerContext = [
    ...(workerTitle ? extractDomainKeywords(workerTitle) : []),
    ...(workerBio ? extractDomainKeywords(workerBio) : []),
    ...workerSkills.flatMap(skill => extractDomainKeywords(skill))
  ]
  
  // Check each required skill
  for (const reqSkill of requiredSkills) {
    let matched = false
    
    // Check for exact match
    const exactMatch = workerSkills.find(ws => 
      ws.toLowerCase().trim() === reqSkill.toLowerCase().trim()
    )
    if (exactMatch) {
      exactMatches.push(reqSkill)
      extraSkills.splice(extraSkills.indexOf(exactMatch), 1)
      matched = true
      continue
    }
    
    // Check for semantic match in worker skills
    const semanticMatch = workerSkills.find(ws => areSkillsRelated(reqSkill, ws))
    if (semanticMatch) {
      semanticMatches.push(reqSkill)
      extraSkills.splice(extraSkills.indexOf(semanticMatch), 1)
      matched = true
      continue
    }
    
    // Enhanced: Check if required skill shares domain with worker context
    // Example: "potato dishes" requirement with "potato peeler" worker title
    const reqSkillDomains = extractDomainKeywords(reqSkill)
    if (reqSkillDomains.length > 0 && workerContext.length > 0) {
      const sharedDomains = reqSkillDomains.filter(d => workerContext.includes(d))
      if (sharedDomains.length > 0) {
        // Match found through domain context
        semanticMatches.push(reqSkill)
        matched = true
        continue
      }
    }
    
    // Enhanced: Check if worker title/bio contains context related to required skill
    const contextText = `${workerTitle || ''} ${workerBio || ''}`.toLowerCase()
    const reqSkillLower = reqSkill.toLowerCase()
    
    // Check for partial matches in context (e.g., "potato peeler" in title matches "potato dishes")
    if (contextText && areSkillsRelated(reqSkill, contextText)) {
      semanticMatches.push(reqSkill)
      matched = true
      continue
    }
    
    if (!matched) {
      missingSkills.push(reqSkill)
    }
  }
  
  const totalMatches = exactMatches.length + semanticMatches.length
  const matchRate = requiredSkills.length > 0 
    ? totalMatches / requiredSkills.length 
    : 0
  
  return {
    exactMatches,
    semanticMatches,
    missingSkills,
    extraSkills,
    matchRate
  }
}

/**
 * Calculate budget fit score
 */
function calculateBudgetFit(
  hourlyRate: number,
  budgetMin?: number,
  budgetMax?: number
): {
  score: number
  details: MatchBreakdown['budgetDetails']
} {
  const details: MatchBreakdown['budgetDetails'] = {
    withinRange: false,
    deviation: 0,
    hourlyRate,
    budgetMin,
    budgetMax
  }
  
  if (budgetMin === undefined && budgetMax === undefined) {
    // No budget constraint
    return { score: 100, details }
  }
  
  if (budgetMin !== undefined && budgetMax !== undefined) {
    // Range provided
    if (hourlyRate >= budgetMin && hourlyRate <= budgetMax) {
      details.withinRange = true
      return { score: 100, details }
    }
    
    // Calculate deviation
    if (hourlyRate < budgetMin) {
      details.deviation = budgetMin - hourlyRate
      // Penalize being below budget (might indicate lower quality)
      const percentOff = (details.deviation / budgetMin) * 100
      return { score: Math.max(0, 100 - percentOff * 2), details }
    } else {
      details.deviation = hourlyRate - budgetMax
      // Penalize being above budget
      const percentOff = (details.deviation / budgetMax) * 100
      return { score: Math.max(0, 100 - percentOff * 1.5), details }
    }
  }
  
  if (budgetMin !== undefined) {
    if (hourlyRate >= budgetMin) {
      details.withinRange = true
      return { score: 100, details }
    }
    details.deviation = budgetMin - hourlyRate
    const percentOff = (details.deviation / budgetMin) * 100
    return { score: Math.max(0, 100 - percentOff * 2), details }
  }
  
  if (budgetMax !== undefined) {
    if (hourlyRate <= budgetMax) {
      details.withinRange = true
      return { score: 100, details }
    }
    details.deviation = hourlyRate - budgetMax
    const percentOff = (details.deviation / budgetMax) * 100
    return { score: Math.max(0, 100 - percentOff * 1.5), details }
  }
  
  return { score: 100, details }
}

/**
 * Calculate experience match score
 */
function calculateExperienceMatch(
  workerTitle: string,
  workerBio: string,
  requiredLevel?: 'junior' | 'mid' | 'senior' | 'expert',
  requiresExperience?: boolean
): {
  score: number
  details: MatchBreakdown['experienceDetails']
} {
  const workerLevel = extractExperienceLevel(workerTitle)
  const experienceKeywords: string[] = []
  
  const titleLower = workerTitle.toLowerCase()
  const bioLower = (workerBio || '').toLowerCase()
  
  const keywordPatterns = [
    'experience', 'experienced', 'professional', 'expert', 'skilled',
    'senior', 'lead', 'principal', 'master', 'veteran', 'seasoned'
  ]
  
  keywordPatterns.forEach(keyword => {
    if (titleLower.includes(keyword) || bioLower.includes(keyword)) {
      experienceKeywords.push(keyword)
    }
  })
  
  let titleRelevance = 50 // Base score
  if (workerLevel) {
    titleRelevance = 70
  }
  if (experienceKeywords.length > 0) {
    titleRelevance = Math.min(100, titleRelevance + experienceKeywords.length * 10)
  }
  
  // Match required vs worker level
  let score = titleRelevance
  if (requiredLevel && workerLevel) {
    const levelHierarchy = { junior: 0, mid: 1, senior: 2, expert: 3 }
    const requiredValue = levelHierarchy[requiredLevel]
    const workerValue = levelHierarchy[workerLevel]
    
    if (workerValue >= requiredValue) {
      // Worker meets or exceeds requirement
      score = Math.min(100, titleRelevance + (workerValue - requiredValue) * 5)
    } else {
      // Worker below requirement
      const gap = requiredValue - workerValue
      score = Math.max(0, titleRelevance - gap * 30)
    }
  } else if (requiresExperience && !workerLevel && experienceKeywords.length === 0) {
    // Experience required but no indication in worker profile
    score = Math.max(0, titleRelevance - 40)
  }
  
  return {
    score,
    details: {
      titleRelevance,
      experienceKeywords,
      requiredLevel,
      workerLevel
    }
  }
}

/**
 * Calculate bio relevance score
 */
function calculateBioRelevance(
  bio: string,
  description: string,
  requiredSkills: string[]
): {
  score: number
  details: MatchBreakdown['bioDetails']
} {
  if (!bio || bio.trim().length === 0) {
    return {
      score: 50, // Neutral score for no bio
      details: {
        keywordsFound: [],
        relevanceScore: 0
      }
    }
  }
  
  const bioLower = bio.toLowerCase()
  const descLower = description.toLowerCase()
  const keywordsFound: string[] = []
  
  // Check for skill mentions in bio
  for (const skill of requiredSkills) {
    if (bioLower.includes(skill.toLowerCase())) {
      keywordsFound.push(skill)
    }
  }
  
  // Check for description keywords in bio
  const descWords = descLower.split(/\W+/).filter(w => w.length > 4)
  descWords.forEach(word => {
    if (bioLower.includes(word) && !keywordsFound.includes(word)) {
      keywordsFound.push(word)
    }
  })
  
  const relevanceScore = Math.min(100, keywordsFound.length * 15)
  const score = 50 + (relevanceScore * 0.5) // Boost from 50-100
  
  return {
    score,
    details: {
      keywordsFound,
      relevanceScore
    }
  }
}

/**
 * Calculate detailed match breakdown for a worker
 */
export function calculateDetailedMatch(
  worker: WorkerProfile,
  requirements: ProjectRequirements
): MatchBreakdown {
  // 1. Skill matching with enhanced context awareness
  const skillDetails = matchSkills(
    requirements.requiredSkills, 
    worker.skills,
    worker.title,
    worker.bio
  )
  
  // Boost score for semantic matches found through context (title/bio)
  const contextMatches = skillDetails.semanticMatches.filter(skill => {
    const workerContext = `${worker.title} ${worker.bio || ''}`.toLowerCase()
    const skillDomains = extractDomainKeywords(skill)
    const contextDomains = extractDomainKeywords(workerContext)
    return skillDomains.some(d => contextDomains.includes(d))
  })
  
  const skillMatch = Math.round(
    (skillDetails.exactMatches.length * 1.0 + 
     skillDetails.semanticMatches.length * 0.8 + // Slightly higher weight
     contextMatches.length * 0.1) / // Bonus for context matches
    Math.max(1, requirements.requiredSkills.length) * 100
  )
  
  // 2. Budget fit
  const budgetResult = calculateBudgetFit(
    worker.hourly_rate,
    requirements.budgetMin,
    requirements.budgetMax
  )
  
  // 3. Experience match
  const experienceResult = calculateExperienceMatch(
    worker.title,
    worker.bio || '',
    requirements.experienceLevel,
    requirements.requiresExperience
  )
  
  // 4. Bio relevance
  const bioResult = calculateBioRelevance(
    worker.bio || '',
    requirements.description,
    requirements.requiredSkills
  )
  
  // Calculate weighted overall score
  // Skills: 40%, Budget: 25%, Experience: 20%, Bio: 15%
  const overall = Math.round(
    skillMatch * 0.40 +
    budgetResult.score * 0.25 +
    experienceResult.score * 0.20 +
    bioResult.score * 0.15
  )
  
  // Generate summary
  const summaryParts: string[] = []
  if (skillDetails.exactMatches.length > 0) {
    summaryParts.push(`${skillDetails.exactMatches.length} exact skill match${skillDetails.exactMatches.length > 1 ? 'es' : ''}`)
  }
  if (skillDetails.semanticMatches.length > 0) {
    summaryParts.push(`${skillDetails.semanticMatches.length} related skill${skillDetails.semanticMatches.length > 1 ? 's' : ''}`)
  }
  if (budgetResult.details.withinRange) {
    summaryParts.push('budget aligned')
  } else if (budgetResult.score < 70) {
    summaryParts.push('budget mismatch')
  }
  if (experienceResult.score > 80) {
    summaryParts.push('experience level matches')
  }
  
  const breakdownSummary = summaryParts.length > 0
    ? summaryParts.join(', ')
    : 'Basic match'
  
  return {
    overall: Math.max(0, Math.min(100, overall)),
    skillMatch,
    skillMatchDetails: skillDetails,
    budgetFit: budgetResult.score,
    budgetDetails: budgetResult.details,
    experienceMatch: experienceResult.score,
    experienceDetails: experienceResult.details,
    bioRelevance: bioResult.score,
    bioDetails: bioResult.details,
    breakdownSummary
  }
}

/**
 * Calculate detailed matches for all workers
 */
export function calculateDetailedMatches(
  workers: WorkerProfile[],
  description: string,
  requiredSkills: string[],
  budgetMin?: number,
  budgetMax?: number
): Map<string, MatchBreakdown> {
  const experienceInfo = detectRequiredExperience(description)
  
  const requirements: ProjectRequirements = {
    description,
    requiredSkills,
    budgetMin,
    budgetMax,
    requiresExperience: experienceInfo.requiresExperience,
    experienceLevel: experienceInfo.level
  }
  
  const results = new Map<string, MatchBreakdown>()
  
  for (const worker of workers) {
    const breakdown = calculateDetailedMatch(worker, requirements)
    results.set(worker.id, breakdown)
  }
  
  return results
}

