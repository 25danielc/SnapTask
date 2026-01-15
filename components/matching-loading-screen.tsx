"use client"

import { Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

interface MatchingLoadingScreenProps {
  progress?: number
}

export function MatchingLoadingScreen({ progress = 0 }: MatchingLoadingScreenProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)

  const messages = [
    "Analyzing your project requirements...",
    "Searching for skilled workers...",
    "Matching skills and expertise...",
    "Calculating compatibility scores...",
    "Finding your perfect matches...",
  ]

  useEffect(() => {
    // Animate progress
    const interval = setInterval(() => {
      setAnimatedProgress((prev) => {
        if (prev >= 100) return 100
        return Math.min(prev + 2, 100)
      })
    }, 100)

    // Rotate messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 2000)

    return () => {
      clearInterval(interval)
      clearInterval(messageInterval)
    }
  }, [messages.length])

  const displayProgress = Math.min(animatedProgress, 95) // Cap at 95% until actually done

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 rounded-full border border-accent/20 animate-pulse-ring"
            style={{
              width: `${200 + i * 150}px`,
              height: `${200 + i * 150}px`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        {/* Animated icon with pulsing effect */}
        <div className="relative">
          {/* Pulsing background */}
          <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-accent/10 backdrop-blur-sm">
            <Sparkles className="h-12 w-12 text-accent animate-pulse" />
          </div>
        </div>

        {/* Progress circle */}
        <div className="relative h-32 w-32">
          <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 128 128">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted/20"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className="text-accent transition-all duration-300 ease-out"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - displayProgress / 100)}`}
            />
          </svg>
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-accent">{Math.round(displayProgress)}%</span>
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold">Finding Your Perfect Matches</h2>
          <p className="text-muted-foreground transition-opacity duration-500">
            {messages[messageIndex]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md">
          <div className="h-2 overflow-hidden rounded-full bg-muted/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent/50 to-accent transition-all duration-300 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

