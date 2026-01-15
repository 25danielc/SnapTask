"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/hooks/use-auth"
import Link from "next/link"

interface PendingMatch {
  id: string
  status: string
  created_at: string
  projects: {
    id: string
    title: string
  }
}

export function NotificationBadge() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<PendingMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    loadPendingMatches()
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingMatches, 30000)
    return () => clearInterval(interval)
  }, [user])

  async function loadPendingMatches() {
    try {
      const response = await fetch("/api/worker/matches")
      if (!response.ok) {
        // User is not a worker, hide the badge
        setMatches([])
        return
      }
      
      const data = await response.json()
      // Filter for pending matches (waiting for worker to accept/decline)
      const pending = (data.matches || []).filter(
        (m: PendingMatch) => m.status === 'pending'
      )
      setMatches(pending)
    } catch (error) {
      // Silently handle errors (user might not be a worker)
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  // Don't show badge if user is not authenticated
  if (!user || loading) {
    return null
  }

  const count = matches.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-2 py-1.5">
          <div className="font-semibold text-sm">Pending Matches</div>
          <div className="text-xs text-muted-foreground">
            {count === 0 ? "No new matches" : `${count} match${count > 1 ? 'es' : ''} awaiting your response`}
          </div>
        </div>
        <DropdownMenuSeparator />
        {count === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No pending matches at this time
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {matches.map((match) => (
              <DropdownMenuItem
                key={match.id}
                asChild
                className="flex flex-col items-start gap-1 p-3"
              >
                <Link href={`/worker/matches/${match.id}`}>
                  <div className="font-medium text-sm">{match.projects.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Matched {new Date(match.created_at).toLocaleDateString()}
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/worker/matches" className="w-full text-center">
            View All Matches
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

