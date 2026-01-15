"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/back-button"
import { ReviewForm } from "@/components/review-form"
import { Clock, MapPin, DollarSign, CheckCircle, User, Briefcase } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Project {
  id: string
  title: string
  description: string
  budget: number | null
  status: string
  location: string | null
  created_at: string
  matches: Array<{
    id: string
    status: string
    match_score: number
    worker_id: string
    workers: {
      id: string
      title: string
      hourly_rate: number
      profiles: {
        id: string
        full_name: string | null
        email: string
        avatar_url: string | null
      }
    }
  }>
}

export default function ClientProjectsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [completingProjectId, setCompletingProjectId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/dashboard/projects")
      return
    }

    if (user) {
      loadProjects()
    }
  }, [user, authLoading, router])

  async function loadProjects() {
    try {
      const response = await fetch("/api/client/projects")
      if (!response.ok) {
        throw new Error("Failed to load projects")
      }
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error("Error loading projects:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCompleteProject(projectId: string) {
    setCompletingProjectId(projectId)
    try {
      const response = await fetch(`/api/client/projects/${projectId}/complete`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to complete project")
      }

      toast.success("Project marked as completed!")
      await loadProjects()
    } catch (error: any) {
      console.error("Error completing project:", error)
      toast.error(error.message || "Failed to complete project")
    } finally {
      setCompletingProjectId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <div className="mb-4">
          <BackButton href="/dashboard" />
        </div>
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline">Open</Badge>
      case "in_progress":
        return <Badge variant="default">In Progress</Badge>
      case "completed":
        return (
          <Badge variant="secondary">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-4">
        <BackButton href="/dashboard" />
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <p className="text-muted-foreground">Manage your projects and leave reviews</p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No projects yet</p>
            <p className="text-sm text-muted-foreground">
              Create a project to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => {
            const acceptedMatches = project.matches.filter((m) => m.status === "accepted" || m.status === "completed")
            const completedMatches = project.matches.filter((m) => m.status === "completed")

            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{project.title}</CardTitle>
                        {getStatusBadge(project.status)}
                      </div>
                      <CardDescription className="line-clamp-2 mt-2">
                        {project.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {project.budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">${project.budget}</span>
                      </div>
                    )}
                    {project.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{project.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {acceptedMatches.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <h3 className="font-semibold">Assigned Workers</h3>
                      {acceptedMatches.map((match) => {
                        const worker = match.workers
                        const profile = worker.profiles
                        const workerName = profile.full_name || profile.email.split("@")[0]
                        const initials = workerName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)

                        return (
                          <div key={match.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={profile.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-medium">{workerName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {worker.title} • ${worker.hourly_rate}/hr
                                </div>
                              </div>
                              <Badge variant="secondary">
                                {match.status === "completed" ? "Completed" : "Active"}
                              </Badge>
                            </div>

                            {project.status === "in_progress" && match.status === "accepted" && (
                              <Button
                                variant="outline"
                                onClick={() => handleCompleteProject(project.id)}
                                disabled={completingProjectId === project.id}
                                className="w-full"
                              >
                                {completingProjectId === project.id
                                  ? "Completing..."
                                  : "Mark Project as Completed"}
                              </Button>
                            )}

                            {match.status === "completed" && project.status === "completed" && (
                              <ReviewForm
                                workerId={match.worker_id}
                                projectId={project.id}
                                projectTitle={project.title}
                                workerName={workerName}
                                onReviewSubmitted={loadProjects}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {acceptedMatches.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No workers assigned yet
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

