import OpenAI from 'openai'

// Initialize OpenAI client (will be null if API key is not set)
let openaiClient: OpenAI | null = null

try {
  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey && apiKey.trim().length > 0) {
    openaiClient = new OpenAI({
      apiKey: apiKey.trim(),
    })
  }
} catch (error) {
  console.error('OpenAI client initialization failed:', error)
}

interface WorkerProfile {
  id: string
  title: string
  skills: string[]
  bio?: string
  hourly_rate?: number
}

interface MatchResult {
  workerId: string
  matchScore: number
  reasoning?: string
}

/**
 * Uses AI to extract relevant skills and professions from a project description
 */
export async function extractSkillsWithAI(description: string): Promise<string[]> {
  if (!openaiClient) {
    return []
  }

  // Clean and validate description
  const cleanedDescription = description?.trim() || ''
  if (!cleanedDescription) {
    console.warn('Empty description provided to extractSkillsWithAI')
    return []
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a skill extraction assistant. Extract all relevant skills, professions, and expertise areas from a project description. 
Return ONLY a JSON array of skill names, nothing else. Be comprehensive and thorough - include:
- Specific professions (e.g., "plumber", "doctor", "developer", "designer", "gardener")
- Technical skills (e.g., "React", "Python", "plumbing", "landscaping", "carpentry")
- Related terms and synonyms (e.g., if someone says "plumber", include "plumbing", "pipe installation", "leak repair", "drain cleaning")
- Tools and technologies mentioned
- Any expertise areas mentioned
- Industry-specific terms
- Task-specific skills (e.g., "installation", "repair", "design", "maintenance")

Be thorough - extract ALL possible relevant skills, even if they're implied or related.

Example: "I need a plumber to fix my kitchen sink"
Should return: ["plumber", "plumbing", "pipe repair", "sink repair", "kitchen plumbing", "leak repair", "drain cleaning", "plumbing repair", "fixture repair"]

Example: "Looking for a full-stack developer to build a web app"
Should return: ["full-stack developer", "web development", "full-stack", "developer", "web app", "programming", "software development"]

Return format: ["skill1", "skill2", "skill3"]`
        },
        {
          role: 'user',
          content: cleanedDescription
        }
      ],
      temperature: 0.3,
      max_tokens: 300, // Increased to allow more skills
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) return []

    // Try to parse JSON array
    try {
      // Remove markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const skills = JSON.parse(cleaned)
      if (Array.isArray(skills)) {
        return skills.map(s => s.toLowerCase().trim()).filter(Boolean)
      }
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON:', content)
    }

    return []
  } catch (error) {
    console.error('Error extracting skills with AI:', error)
    return []
  }
}

/**
 * Uses AI to calculate match scores between a project description and workers
 */
export async function calculateAIMatchScores(
  description: string,
  workers: WorkerProfile[],
  budgetMin?: number,
  budgetMax?: number
): Promise<MatchResult[]> {
  if (!openaiClient || workers.length === 0) {
    return []
  }

  // Clean and validate description
  const cleanedDescription = description?.trim() || ''
  if (!cleanedDescription) {
    console.warn('Empty description provided to calculateAIMatchScores')
    return []
  }

  try {
    // Prepare worker data for AI
    const workerData = workers.map(w => ({
      id: w.id,
      title: w.title,
      skills: w.skills.join(', '),
      bio: w.bio || '',
      hourly_rate: w.hourly_rate || 0
    }))

    // Build budget constraint message
    let budgetMessage = ''
    if (budgetMin !== undefined && budgetMax !== undefined) {
      budgetMessage = `Budget range: $${budgetMin}-$${budgetMax} per hour. Strongly prioritize workers whose hourly rates fall within this range.`
    } else if (budgetMin !== undefined) {
      budgetMessage = `Budget minimum: $${budgetMin} per hour. Prioritize workers with hourly rates at or above this amount.`
    } else if (budgetMax !== undefined) {
      budgetMessage = `Budget maximum: $${budgetMax} per hour. Prioritize workers with hourly rates at or below this amount.`
    }

    // Detect experience preference - be more thorough
    const descLower = cleanedDescription.toLowerCase()
    const experiencePref = descLower.includes('senior') || 
                          descLower.includes('experienced') ||
                          descLower.includes('more experience') ||
                          descLower.includes('higher level') ||
                          descLower.includes('professional') ||
                          descLower.includes('expert') ||
                          descLower.includes('advanced') ||
                          descLower.includes('seasoned') ||
                          descLower.includes('veteran')
    
    const experienceMessage = experiencePref 
      ? 'PREFER workers with titles indicating seniority/experience (e.g., "Senior", "Expert", "Professional", "Lead") over students or junior workers. Significantly boost scores for experienced workers. Penalize students/junior workers unless they are exceptional matches.'
      : ''

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a matching assistant. Score how well each worker matches a project description on a scale of 0-100.

Analyze the project description carefully and consider:
- Exact skill matches (worker has the exact skills mentioned)
- Semantic similarity (e.g., "plumber" matches "plumbing", "pipe installation", "drain cleaning")
- Context-aware matching (e.g., "potato peeler" should match "making potato dishes" because they share the potato/culinary domain)
- Domain relationships (e.g., if project needs "potato dishes", match workers with "potato peeler", "food prep", "culinary skills", "roasted potatoes")
- Profession relevance (e.g., "I need a plumber" should match workers with plumbing-related skills)
- Title relevance and experience level (match the experience level requested)
- Budget/hourly rate compatibility (if specified)
- Overall fit and context understanding - understand the GOAL and INTENTION behind the project
- Related skills and expertise areas - think about what skills would naturally be related
- Implied skills (e.g., "making potato dishes" implies food prep, cooking, culinary skills, kitchen work)

IMPORTANT: Understand the context and goals, not just exact word matches. A worker's title or existing skills may indicate they can do related work even if not explicitly stated.

${budgetMessage}
${experienceMessage}

IMPORTANT: Score ALL workers. Be lenient with scoring:
- 85-100: Excellent match (exact skills, perfect fit, within budget)
- 70-84: Very good match (most skills match, good fit, close to budget)
- 55-69: Good match (some relevant skills, decent fit)
- 40-54: Fair match (partial relevance, might work, some related skills)
- 30-39: Weak match (minimal relevance, but still worth considering)
- 0-29: Poor match (no real relevance)

Return ONLY a JSON array of objects with this exact format:
[
  {"workerId": "id1", "matchScore": 95, "reasoning": "brief explanation"},
  {"workerId": "id2", "matchScore": 60, "reasoning": "brief explanation"}
]

Ensure ALL workers receive a score. Give at least 40+ to workers with ANY relevant skills or experience, even if not a perfect fit.`
        },
        {
          role: 'user',
          content: `Project Description:
"${cleanedDescription}"

${budgetMessage ? `\n${budgetMessage}\n` : ''}
${experienceMessage ? `\n${experienceMessage}\n` : ''}

Available Workers:
${workerData.map((w, i) => `${i + 1}. Worker ID: ${w.id}
   Title: ${w.title}
   Hourly Rate: $${w.hourly_rate}/hr
   Skills: ${w.skills || 'None listed'}
   Bio: ${w.bio || 'No bio provided'}`).join('\n\n')}

Analyze the project description thoroughly. Consider:
1. What is the GOAL of the project? What is the client trying to accomplish?
2. What SKILLS are needed (both explicit and implied)?
3. What DOMAIN/CONTEXT does this fall under (culinary, construction, technical, etc.)?
4. Are there workers whose titles, skills, or experience suggest they could handle this work?
5. Think about semantic relationships - e.g., "potato peeler" → "potato dishes" → "food preparation" → "culinary skills"

Examples of good context matching:
- Worker: "Potato Peeler" → Project: "Making potato dishes" → HIGH MATCH (same domain, related work)
- Worker: "Chef" → Project: "Need someone to make roasted potatoes" → HIGH MATCH (culinary domain)
- Worker: "Food Prep Worker" → Project: "Cooking potato dishes" → HIGH MATCH (food/cooking domain)

Return match scores for ALL workers (not just the best ones). Every worker must receive a score between 0-100. 
Prioritize workers within the budget range and with appropriate experience level when specified, but still score everyone.
Give at least 50+ scores to workers with relevant domain/semantic matches, even if skills don't match exactly.
Be generous with context-aware matches - if a worker's title or skills suggest they can do related work in the same domain, score them highly.`
        }
      ],
      temperature: 0.2,
      max_tokens: 1500, // Increased to handle more workers and detailed reasoning
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) return []

    try {
      // Remove markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const results = JSON.parse(cleaned)
      
      if (Array.isArray(results)) {
        return results.map((r: any) => ({
          workerId: r.workerId || r.worker_id || r.id,
          matchScore: Math.min(100, Math.max(0, Number(r.matchScore || r.match_score || 0))),
          reasoning: r.reasoning || ''
        }))
      }
    } catch (parseError) {
      console.warn('Failed to parse AI match scores:', content)
    }

    return []
  } catch (error) {
    console.error('Error calculating AI match scores:', error)
    return []
  }
}

/**
 * Checks if OpenAI is available
 */
export function isAIAvailable(): boolean {
  return openaiClient !== null
}

