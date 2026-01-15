"use client"

import { useEffect, useState } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const AVAILABILITY_OPTIONS = [
  "Available Now",
  "Available in 2 hours",
  "Available in 1 day",
  "Available in 2 days",
  "Available in 1 week",
]

interface FilterBarProps {
  selectedSkills: string[]
  selectedAvailability: string[]
  onSkillsChange: (skills: string[]) => void
  onAvailabilityChange: (availability: string[]) => void
  onClearAll: () => void
}

export function FilterBar({
  selectedSkills,
  selectedAvailability,
  onSkillsChange,
  onAvailabilityChange,
  onClearAll,
}: FilterBarProps) {
  const [availableSkills, setAvailableSkills] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSkills() {
      try {
        const response = await fetch("/api/skills")
        if (response.ok) {
          const data = await response.json()
          setAvailableSkills(data.skills || [])
        }
      } catch (error) {
        console.error("Error fetching skills:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSkills()
  }, [])

  const handleSkillToggle = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      onSkillsChange(selectedSkills.filter(s => s !== skillName))
    } else {
      onSkillsChange([...selectedSkills, skillName])
    }
  }

  const handleAvailabilityToggle = (availability: string) => {
    if (selectedAvailability.includes(availability)) {
      onAvailabilityChange(selectedAvailability.filter(a => a !== availability))
    } else {
      onAvailabilityChange([...selectedAvailability, availability])
    }
  }

  const activeFilters = [...selectedSkills, ...selectedAvailability]
  const hasActiveFilters = activeFilters.length > 0

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Skills</DropdownMenuLabel>
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading skills...</div>
            ) : availableSkills.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No skills available</div>
            ) : (
              availableSkills.map((skill) => (
                <DropdownMenuCheckboxItem
                  key={skill.id}
                  checked={selectedSkills.includes(skill.name)}
                  onCheckedChange={() => handleSkillToggle(skill.name)}
                >
                  {skill.name}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Availability</DropdownMenuLabel>
          {AVAILABILITY_OPTIONS.map((availability) => (
            <DropdownMenuCheckboxItem
              key={availability}
              checked={selectedAvailability.includes(availability)}
              onCheckedChange={() => handleAvailabilityToggle(availability)}
            >
              {availability}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasActiveFilters && (
        <>
          {selectedSkills.map((skill) => (
            <Badge key={skill} variant="secondary" className="px-3 py-1.5 gap-1.5">
              {skill}
              <button
                onClick={() => handleSkillToggle(skill)}
                className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                aria-label={`Remove ${skill} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedAvailability.map((availability) => (
            <Badge key={availability} variant="secondary" className="px-3 py-1.5 gap-1.5">
              {availability}
              <button
                onClick={() => handleAvailabilityToggle(availability)}
                className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                aria-label={`Remove ${availability} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-muted-foreground"
            onClick={onClearAll}
          >
            Clear all
          </Button>
        </>
      )}
    </div>
  )
}
