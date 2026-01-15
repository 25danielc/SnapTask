"use client"

import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface HeroSectionProps {
  onModeSwitch: () => void
}

export function HeroSection({ onModeSwitch }: HeroSectionProps) {
  return (
    <section className="border-b border-border bg-gradient-to-b from-background to-secondary/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
            <Sparkles className="h-4 w-4" />
            AI-Powered Matching
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Find the Perfect Match for Your Project
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground text-pretty">
            Connect with skilled workers instantly. Search by expertise, availability, and project needs. Simple, fast,
            and intelligent matching.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="h-12 px-8 text-base" onClick={onModeSwitch}>
              Get Instant Match
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-transparent" asChild>
              <Link href="/become-worker">Post Your Expertise</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
