/**
 * Helper functions for normalizing worker/profile data from Supabase
 */

export interface WorkerData {
  id: string
  name: string
  title: string
  rating: number
  reviews: number
  hourlyRate: number
  skills: string[]
  availability: string
  image: string
  location?: string | null
}

/**
 * Normalizes profile data - handles both array and object formats
 * Supabase returns profiles as an object when using foreign key relationship
 */
function normalizeProfile(worker: any) {
  // Try different possible formats
  if (worker.profiles) {
    if (Array.isArray(worker.profiles)) {
      return worker.profiles[0] || {}
    }
    return worker.profiles
  }
  if (worker.profile) {
    if (Array.isArray(worker.profile)) {
      return worker.profile[0] || {}
    }
    return worker.profile
  }
  return {}
}

/**
 * Extracts skills from worker data
 */
function extractSkills(worker: any): string[] {
  const workerSkills = worker.worker_skills || worker.skills || []
  return workerSkills
    .map((ws: any) => {
      const skill = ws.skill || ws.skills
      return Array.isArray(skill) ? skill[0]?.name : skill?.name
    })
    .filter(Boolean)
}

/**
 * Transforms Supabase worker data to standardized format
 */
export function transformWorkerData(worker: any): WorkerData {
  const profile = normalizeProfile(worker)
  
  // Use profile name, or fallback to title, or email, or "Worker"
  const name = profile.full_name || worker.title || profile.email || "Worker"
  
  return {
    id: worker.id,
    name: name,
    title: worker.title || "",
    rating: Number(worker.rating) || 0,
    reviews: worker.reviews_count || 0,
    hourlyRate: Number(worker.hourly_rate) || 0,
    skills: extractSkills(worker),
    availability: worker.availability || "Available Now",
    image: worker.image_url || profile.avatar_url || "/placeholder-user.jpg",
    location: worker.location || null,
  }
}

