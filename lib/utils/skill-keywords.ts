/**
 * Skill keywords for matching project descriptions to worker skills
 * Organized by category for easier maintenance
 */

export const SKILL_KEYWORDS = [
  // Frontend
  'react', 'vue', 'angular', 'svelte', 'typescript', 'javascript', 'html', 'css',
  'frontend', 'ui', 'ux', 'figma', 'design',
  
  // Backend
  'node', 'python', 'java', 'go', 'rust', 'php', 'ruby', 'backend', 'api',
  
  // Databases
  'postgresql', 'mysql', 'mongodb', 'redis', 'database', 'sql',
  
  // DevOps & Cloud
  'aws', 'docker', 'kubernetes', 'ci/cd', 'devops', 'cloud',
  
  // Full Stack
  'fullstack', 'full-stack', 'web development',
  
  // Mobile
  'mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin',
  
  // AI/ML
  'machine learning', 'ai', 'tensorflow', 'pytorch', 'data science', 'deep learning',
  
  // Blockchain
  'blockchain', 'solidity', 'web3', 'smart contracts', 'ethereum',
  
  // Trades & Services
  'plumber', 'plumbing', 'pipe installation', 'leak repair', 'water heater', 'drain cleaning',
  'electrician', 'electrical', 'wiring', 'electrical repair',
  'carpenter', 'carpentry', 'woodworking', 'cabinet making',
  'painter', 'painting', 'interior painting', 'exterior painting',
  'mechanic', 'auto repair', 'car repair', 'automotive',
  'hvac', 'heating', 'cooling', 'air conditioning', 'furnace',
  'roofer', 'roofing', 'roof repair',
  'handyman', 'general contractor', 'home repair',
  
  // Medical & Health
  'doctor', 'physician', 'medical', 'health', 'nurse', 'dentist', 'therapist',
  'psychologist', 'counselor', 'chiropractor', 'physical therapy',
  
  // Agriculture
  'farming', 'organic', 'agriculture', 'crop', 'livestock', 'sustainable farming',
  
  // Professional Services
  'lawyer', 'attorney', 'legal', 'accountant', 'cpa', 'financial advisor',
  'consultant', 'business consultant', 'marketing', 'seo', 'social media',
  
  // Creative
  'photographer', 'videographer', 'graphic design', 'illustrator', 'writer', 'editor',
  
  // Education
  'teacher', 'tutor', 'instructor', 'coach', 'training',
] as const

/**
 * Finds skills in a description (case-insensitive)
 */
export function findSkillsInDescription(description: string): string[] {
  const lowerDescription = description.toLowerCase()
  return SKILL_KEYWORDS.filter(keyword => lowerDescription.includes(keyword))
}

