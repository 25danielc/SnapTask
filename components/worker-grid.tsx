"use client"

import { useEffect, useState } from "react"
import { WorkerCard } from "@/components/worker-card"
import { FilterBar } from "@/components/filter-bar"
import { Skeleton } from "@/components/ui/skeleton"
import { transformWorkerData, type WorkerData } from "@/lib/utils/worker-data"

export function WorkerGrid() {
  const [workers, setWorkers] = useState<WorkerData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([])

  useEffect(() => {
    async function fetchWorkers() {
      try {
        setLoading(true)
        
        // Build query params
        const params = new URLSearchParams()
        if (selectedSkills.length > 0) {
          // For now, filter by first skill (API supports single skill)
          // Client-side filtering will handle multiple skills
          params.append('skill', selectedSkills[0])
        }
        if (selectedAvailability.length > 0) {
          // API supports single availability, we'll filter client-side for multiple
          params.append('availability', selectedAvailability[0])
        }

        const url = `/api/workers${params.toString() ? `?${params.toString()}` : ''}`
        const response = await fetch(url, {
          // Use next revalidation for faster loads
          next: { revalidate: 60 }
        })
        
        if (!response.ok) {
          let errorMessage = "Failed to fetch workers"
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            errorMessage = response.statusText || errorMessage
          }
          throw new Error(errorMessage)
        }
        
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }

        // Filter client-side for multiple skills/availability
        let filteredData = data || []
        
        if (selectedSkills.length > 0) {
          filteredData = filteredData.filter((worker: WorkerData) =>
            selectedSkills.some(skill =>
              worker.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
            )
          )
        }
        
        if (selectedAvailability.length > 0) {
          filteredData = filteredData.filter((worker: WorkerData) =>
            selectedAvailability.includes(worker.availability)
          )
        }

        setWorkers(filteredData)
      } catch (error) {
        console.error("Error fetching workers:", error)
        setWorkers([])
      } finally {
        setLoading(false)
      }
    }

    fetchWorkers()
  }, [selectedSkills, selectedAvailability])

  const handleClearAll = () => {
    setSelectedSkills([])
    setSelectedAvailability([])
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FilterBar
          selectedSkills={selectedSkills}
          selectedAvailability={selectedAvailability}
          onSkillsChange={setSelectedSkills}
          onAvailabilityChange={setSelectedAvailability}
          onClearAll={handleClearAll}
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <FilterBar
        selectedSkills={selectedSkills}
        selectedAvailability={selectedAvailability}
        onSkillsChange={setSelectedSkills}
        onAvailabilityChange={setSelectedAvailability}
        onClearAll={handleClearAll}
      />
      {workers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {selectedSkills.length > 0 || selectedAvailability.length > 0
              ? "No workers found matching your filters."
              : "No workers found. Be the first to sign up!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} />
          ))}
        </div>
      )}
    </section>
  )
}
