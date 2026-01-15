"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/back-button"
import { Clock, MapPin, DollarSign, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Match {
  id: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  match_score: number
  created_at: string
  projects: {
    id: string
    title: string
    description: string
    budget: number | null
    location: string | null
    status: string
    client: {
      id: string
      full_name: string | null
      email: string
      avatar_url: string | null
    }
  }
}

export default function WorkerMatchesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/worker/matches")
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
      setMatches(data.matches || [])
    } catch (error) {
      console.error("Error loading matches:", error)
      toast.error("Failed to load matches")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'completed':
        return <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      default:
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
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
        <h1 className="text-3xl font-bold">My Matches</h1>
        <p className="text-muted-foreground">Projects you've been matched with</p>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No matches yet</p>
            <p className="text-sm text-muted-foreground">
              When clients create projects that match your skills, they'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <Card key={match.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{match.projects.title}</CardTitle>
                      {getStatusBadge(match.status)}
                      <Badge variant="secondary">{match.match_score}% Match</Badge>
                    </div>
                    <CardDescription className="line-clamp-2 mt-2">
                      {match.projects.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                    <span>{new Date(match.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Client: {match.projects.client.full_name || match.projects.client.email}
                  </div>
                  <Button asChild>
                    <Link href={`/worker/matches/${match.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

