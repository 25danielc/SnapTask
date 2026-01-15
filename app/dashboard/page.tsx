"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/back-button"

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const supabase = createClient()
  const [stats, setStats] = useState({
    projects: 0,
    matches: 0,
    workers: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirect=/dashboard")
      return
    }

    if (user) {
      loadStats()
    }
  }, [user, loading, router])

  async function loadStats() {
    if (!user) return

    try {
      // Parallel fetch all stats simultaneously for faster loading
      const [projectsResult, userProjectsResult, workerResult] = await Promise.all([
        supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("client_id", user.id),
        supabase
          .from("projects")
          .select("id")
          .eq("client_id", user.id),
        supabase
          .from("workers")
          .select("id")
          .eq("user_id", user.id)
          .single()
      ])

      const projectIds = userProjectsResult.data?.map(p => p.id) || []
      
      // Fetch matches count if we have projects
      let matchesCount = 0
      if (projectIds.length > 0) {
        const { count } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .in("project_id", projectIds)
        matchesCount = count || 0
      }

      setStats({
        projects: projectsResult.count || 0,
        matches: matchesCount,
        workers: workerResult.data ? 1 : 0,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  if (loading || loadingStats) {
    return (
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
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
        <BackButton href="/" />
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
            <CardDescription>Projects you've created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.projects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matches</CardTitle>
            <CardDescription>Active matches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.matches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Worker Profile</CardTitle>
            <CardDescription>Your worker status</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.workers > 0 ? (
              <div className="text-sm text-muted-foreground">Active</div>
            ) : (
              <Button asChild>
                <Link href="/become-worker">Create Profile</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.workers > 0 ? (
              <>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/worker/matches">My Matches</Link>
                </Button>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/worker/dashboard">Worker Dashboard</Link>
                </Button>
              </>
            ) : (
              <Button asChild className="w-full" variant="outline">
                <Link href="/become-worker">Become a Worker</Link>
              </Button>
            )}
            <Button asChild className="w-full" variant="outline">
              <Link href="/">Browse Workers</Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/dashboard/projects">My Projects</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <div className="font-medium">Email</div>
              <div className="text-muted-foreground">{user.email}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

