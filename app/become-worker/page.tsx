"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/use-auth"
import { BackButton } from "@/components/back-button"

export default function BecomeWorkerPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    hourlyRate: "",
    availability: "Available Now",
    location: "",
    bio: "",
    skills: [] as string[],
  })
  const [availableSkills, setAvailableSkills] = useState<Array<{ id: string; name: string }>>([])
  const [selectedSkill, setSelectedSkill] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/become-worker")
      return
    }

    // Fetch available skills
    async function fetchSkills() {
      const { data } = await supabase.from("skills").select("id, name").order("name")
      if (data) setAvailableSkills(data)
    }
    fetchSkills()
  }, [user, authLoading, router, supabase])

  const handleAddSkill = () => {
    if (selectedSkill && !formData.skills.includes(selectedSkill)) {
      setFormData({ ...formData, skills: [...formData.skills, selectedSkill] })
      setSelectedSkill("")
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)

    try {
      // Check if worker profile already exists
      const { data: existingWorker } = await supabase
        .from("workers")
        .select("id")
        .eq("user_id", user.id)
        .single()

      let worker
      if (existingWorker) {
        // Update existing worker profile
        const { data: updatedWorker, error: updateError } = await supabase
          .from("workers")
          .update({
            title: formData.title,
            hourly_rate: parseFloat(formData.hourlyRate),
            availability: formData.availability,
            location: formData.location.trim() || null,
          })
          .eq("user_id", user.id)
          .select()
          .single()

        if (updateError) throw updateError
        worker = updatedWorker
      } else {
        // Create new worker profile
        const { data: newWorker, error: createError } = await supabase
          .from("workers")
          .insert({
            user_id: user.id,
            title: formData.title,
            hourly_rate: parseFloat(formData.hourlyRate),
            availability: formData.availability,
            location: formData.location.trim() || null,
          })
          .select()
          .single()

        if (createError) throw createError
        worker = newWorker
      }

      if (!worker) throw new Error("Failed to create or update worker profile")

      // Update profile bio
      await supabase
        .from("profiles")
        .update({ bio: formData.bio })
        .eq("id", user.id)

      // Add skills - create them if they don't exist
      if (formData.skills.length > 0) {
        const skillIds: string[] = []
        
        for (const skillName of formData.skills) {
          // Check if skill exists (case-insensitive)
          let { data: existingSkill } = await supabase
            .from("skills")
            .select("id, name")
            .ilike("name", skillName)
            .single()

          // If skill doesn't exist, create it
          if (!existingSkill) {
            const capitalizedName = skillName.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ')
            
            const { data: newSkill, error: createError } = await supabase
              .from("skills")
              .insert({ name: capitalizedName })
              .select()
              .single()

            if (!createError && newSkill) {
              existingSkill = newSkill
            }
          }

          if (existingSkill && !skillIds.includes(existingSkill.id)) {
            skillIds.push(existingSkill.id)
          }
        }

        // Remove existing skills
        await supabase
          .from("worker_skills")
          .delete()
          .eq("worker_id", worker.id)

        // Add new skills
        if (skillIds.length > 0) {
          const skillInserts = skillIds.map(skillId => ({
            worker_id: worker.id,
            skill_id: skillId,
          }))

          await supabase.from("worker_skills").insert(skillInserts)
        }
      }

      toast.success("Your expertise profile is now live! Clients can find and match with you anytime.")
      router.push("/")
    } catch (error: any) {
      toast.error(error.message || "Failed to create worker profile")
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-4">
        <BackButton href="/" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Become a Worker</CardTitle>
          <CardDescription>Post your expertise and skills anytime. Your profile will be visible to clients looking for your services, whether they're searching now or in the future.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="e.g., Full-Stack Developer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 85.00"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <select
                id="availability"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                required
              >
                <option value="Available Now">Available Now</option>
                <option value="Available in 2 hours">Available in 2 hours</option>
                <option value="Available in 1 day">Available in 1 day</option>
                <option value="Available in 2 days">Available in 2 days</option>
                <option value="Available in 1 week">Available in 1 week</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, State or Address (e.g., San Francisco, CA)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Let clients know where you're located
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself and your expertise..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex gap-2">
                <select
                  className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                >
                  <option value="">Select a skill...</option>
                  {availableSkills
                    .filter(skill => !formData.skills.includes(skill.name))
                    .map(skill => (
                      <option key={skill.id} value={skill.name}>{skill.name}</option>
                    ))}
                </select>
                <Button type="button" onClick={handleAddSkill} variant="outline" disabled={!selectedSkill}>
                  Add
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Or type a skill name and press Enter
              </div>
              <Input
                placeholder="Type a skill name and press Enter..."
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && selectedSkill.trim()) {
                    e.preventDefault()
                    handleAddSkill()
                  }
                }}
              />
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating profile..." : "Create Worker Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

