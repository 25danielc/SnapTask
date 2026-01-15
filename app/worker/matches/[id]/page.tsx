"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/back-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, MapPin, DollarSign, CheckCircle, XCircle, AlertCircle, MessageSquare, User, Shield, Car, FileCheck, Calendar } from "lucide-react"
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
    budget_min: number | null
    budget_max: number | null
    location: string | null
    timeline: string | null
    safety_features: string | null
    transportation_provided: boolean | null
    requires_license: boolean | null
    requires_insurance: boolean | null
    work_environment: string | null
    equipment_provided: string | null
    status: string
    created_at: string
    client: {
      id: string
      full_name: string | null
      email: string
      avatar_url: string | null
      bio: string | null
    }
    project_skills: Array<{
      skills: {
        id: string
        name: string
      }
    }>
  }
}

export default function MatchDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/worker/matches/${params.id}`)
      return
    }

    if (user && params.id) {
      loadMatch()
    }
  }, [user, authLoading, params.id, router])

  async function loadMatch() {
    try {
      const response = await fetch(`/api/worker/matches/${params.id}`)
      if (!response.ok) {
        throw new Error("Failed to load match")
      }
      const data = await response.json()
      setMatch(data.match)
    } catch (error) {
      console.error("Error loading match:", error)
      toast.error("Failed to load match details")
      router.push("/worker/matches")
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept() {
    if (!match) return
    
    setProcessing(true)
    try {
      const response = await fetch(`/api/worker/matches/${match.id}/accept`, {
        method: "POST",
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to accept match")
      }
      toast.success("Match accepted successfully!")
      router.push("/worker/dashboard")
    } catch (error: any) {
      console.error("Error accepting match:", error)
      toast.error(error.message || "Failed to accept match")
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject() {
    if (!match) return
    
    if (!confirm("Are you sure you want to reject this match?")) {
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/worker/matches/${match.id}/reject`, {
        method: "POST",
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to reject match")
      }
      toast.success("Match rejected")
      router.push("/worker/matches")
    } catch (error: any) {
      console.error("Error rejecting match:", error)
      toast.error(error.message || "Failed to reject match")
    } finally {
      setProcessing(false)
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
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!user || !match) {
    return null
  }

  const client = match.projects.client
  const skills = match.projects.project_skills?.map(ps => ps.skills.name) || []

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-4">
        <BackButton href="/worker/matches" />
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{match.projects.title}</h1>
          {getStatusBadge(match.status)}
          <Badge variant="secondary">{match.match_score}% Match</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{match.projects.description}</p>
            </CardContent>
          </Card>

          {skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(match.projects.budget_min || match.projects.budget_max || match.projects.budget) && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Budget</div>
                    <div className="text-sm text-muted-foreground">
                      {match.projects.budget_min && match.projects.budget_max
                        ? `$${match.projects.budget_min} - $${match.projects.budget_max}`
                        : match.projects.budget
                        ? `$${match.projects.budget}`
                        : match.projects.budget_min
                        ? `$${match.projects.budget_min}+`
                        : `Up to $${match.projects.budget_max}`}
                    </div>
                  </div>
                </div>
              )}
              {match.projects.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-sm text-muted-foreground">{match.projects.location}</div>
                  </div>
                </div>
              )}
              {match.projects.timeline && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Timeline</div>
                    <div className="text-sm text-muted-foreground">{match.projects.timeline}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Posted</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(match.projects.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {(match.projects.safety_features || 
            match.projects.transportation_provided !== null ||
            match.projects.requires_license !== null ||
            match.projects.requires_insurance !== null ||
            match.projects.work_environment ||
            match.projects.equipment_provided) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {match.projects.safety_features && (
                  <div>
                    <div className="font-medium mb-1 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Safety Features
                    </div>
                    <div className="text-sm text-muted-foreground">{match.projects.safety_features}</div>
                  </div>
                )}
                {(match.projects.transportation_provided !== null ||
                  match.projects.requires_license !== null ||
                  match.projects.requires_insurance !== null) && (
                  <div className="flex flex-wrap gap-3">
                    {match.projects.transportation_provided && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        Transportation Provided
                      </Badge>
                    )}
                    {match.projects.requires_license && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <FileCheck className="h-3 w-3" />
                        License Required
                      </Badge>
                    )}
                    {match.projects.requires_insurance && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Insurance Required
                      </Badge>
                    )}
                  </div>
                )}
                {match.projects.work_environment && (
                  <div>
                    <div className="font-medium mb-1">Work Environment</div>
                    <div className="text-sm text-muted-foreground">{match.projects.work_environment}</div>
                  </div>
                )}
                {match.projects.equipment_provided && (
                  <div>
                    <div className="font-medium mb-1">Equipment Provided</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{match.projects.equipment_provided}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={client.avatar_url || undefined} />
                  <AvatarFallback>
                    {client.full_name ? client.full_name[0] : client.email[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{client.full_name || "Client"}</div>
                  <div className="text-sm text-muted-foreground">{client.email}</div>
                </div>
              </div>
              {client.bio && (
                <div className="text-sm text-muted-foreground">{client.bio}</div>
              )}
            </CardContent>
          </Card>

          {match.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleAccept} 
                  disabled={processing}
                  className="w-full"
                  size="lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Match
                </Button>
                <Button 
                  onClick={handleReject} 
                  disabled={processing}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Match
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => toast.info("Messaging feature coming soon")}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Client
                </Button>
              </CardContent>
            </Card>
          )}

          {match.status === 'accepted' && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  asChild
                  className="w-full"
                  size="lg"
                >
                  <a href="/worker/dashboard">View Progress Dashboard</a>
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => toast.info("Messaging feature coming soon")}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Client
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

