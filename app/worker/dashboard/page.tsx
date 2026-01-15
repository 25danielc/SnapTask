"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/back-button"
import { Clock, MapPin, DollarSign, CheckCircle, User, Briefcase } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AcceptedMatch {
  id: string
  status: 'accepted' | 'completed'
  match_score: number
  created_at: string
  projects: {
    id: string
    title: string
    description: string
    budget: number | null
    location: string | null
    status: string
    created_at: string
    client: {
      id: string
      full_name: string | null
      email: string
      avatar_url: string | null
    }
  }
}

export default function WorkerDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [matches, setMatches] = useState<AcceptedMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    totalEarnings: 0,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/worker/dashboard")
      return
    }

    if (user) {
      loadMatches()
    }
  }, [user, authLoading, router])

  async function loadMatches() {
    try {
      const response = await fetch("/api/worker/matches")
      if (!response.ok) {
        throw new Error("Failed to load matches")
      }
      const data = await response.json()
      const acceptedMatches = (data.matches || []).filter(
        (m: AcceptedMatch) => m.status === 'accepted' || m.status === 'completed'
      )
      setMatches(acceptedMatches)

      // Calculate stats
      const active = acceptedMatches.filter((m: AcceptedMatch) => m.status === 'accepted').length
      const completed = acceptedMatches.filter((m: AcceptedMatch) => m.status === 'completed').length
      const totalEarnings = acceptedMatches.reduce((sum: number, m: AcceptedMatch) => {
        return sum + (m.projects.budget || 0)
      }, 0)

      setStats({ active, completed, totalEarnings })
    } catch (error) {
      console.error("Error loading matches:", error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-4">
        <BackButton href="/dashboard" />
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Worker Dashboard</h1>
        <p className="text-muted-foreground">Track your accepted projects and progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.active}</div>
            <p className="text-sm text-muted-foreground mt-1">Projects in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completed}</div>
            <p className="text-sm text-muted-foreground mt-1">Finished projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${stats.totalEarnings.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-1">From all projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Projects */}
      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No active projects yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Accept matches from your matches page to see them here.
            </p>
            <Button asChild>
              <Link href="/worker/matches">View Matches</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Active Projects</h2>
            <div className="space-y-4">
              {matches
                .filter((m) => m.status === 'accepted')
                .map((match) => (
                  <Card key={match.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{match.projects.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {match.projects.description}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="ml-4">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        {match.projects.budget && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">${match.projects.budget}</span>
                          </div>
                        )}
                        {match.projects.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{match.projects.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Started {new Date(match.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{match.projects.client.full_name || match.projects.client.email}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline">
                          <Link href={`/worker/matches/${match.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          {/* Completed Projects */}
          {matches.filter((m) => m.status === 'completed').length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Completed Projects</h2>
              <div className="space-y-4">
                {matches
                  .filter((m) => m.status === 'completed')
                  .map((match) => (
                    <Card key={match.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{match.projects.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {match.projects.description}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="ml-4">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {match.projects.budget && (
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">${match.projects.budget}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Completed {new Date(match.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{match.projects.client.full_name || match.projects.client.email}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

