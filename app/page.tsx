"use client"

import { useState } from "react"
import { SearchHeader } from "@/components/search-header"
import { WorkerGrid } from "@/components/worker-grid"
import { HeroSection } from "@/components/hero-section"
import { InstantMatchFlow } from "@/components/instant-match-flow"

export default function Home() {
  const [viewMode, setViewMode] = useState<"browse" | "instant">("browse")

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader viewMode={viewMode} onViewModeChange={setViewMode} />
      {viewMode === "browse" ? (
        <>
          <HeroSection onModeSwitch={() => setViewMode("instant")} />
          <WorkerGrid />
        </>
      ) : (
        <InstantMatchFlow onBack={() => setViewMode("browse")} />
      )}
    </div>
  )
}
