"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/back-button"
import { StarRating } from "@/components/star-rating"
import { Star, Clock, DollarSign, User, MapPin } from "lucide-react"
import type { WorkerData } from "@/lib/utils/worker-data"

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  client: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
  projects: {
    id: string
    title: string
  } | null
}

export default function WorkerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const workerId = params.id as string
  const [worker, setWorker] = useState<WorkerData | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWorker() {
      try {
        const response = await fetch(`/api/workers/${workerId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch worker")
        }
        const data = await response.json()
        setWorker(data.worker)
        setReviews(data.reviews || [])
      } catch (error) {
        console.error("Error fetching worker:", error)
      } finally {
        setLoading(false)
      }
    }

    if (workerId) {
      fetchWorker()
    }
  }, [workerId])

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <div className="mb-4">
          <BackButton href="/" />
        </div>
        <Skeleton className="h-64 w-full mb-8" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <div className="mb-4">
          <BackButton href="/" />
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Worker not found</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const initials = worker.name
    .split(" ")
    .map((n) => n[0])
    .join("")

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : worker.rating

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-4">
        <BackButton href="/" />
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarImage src={worker.image} alt={worker.name} />
              <AvatarFallback className="bg-accent text-accent-foreground text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{worker.name}</h1>
              <p className="text-xl text-muted-foreground mb-4">{worker.title}</p>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <StarRating rating={averageRating} />
                  <span className="font-semibold">{averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{worker.availability}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>${worker.hourlyRate}/hr</span>
                </div>
                {worker.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{worker.location}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {worker.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>
              {reviews.length === 0
                ? "No reviews yet"
                : `${reviews.length} review${reviews.length !== 1 ? "s" : ""}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                This worker hasn't received any reviews yet.
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => {
                  const clientInitials = (review.client.full_name || review.client.email)
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)

                  return (
                    <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={review.client.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {clientInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {review.client.full_name || review.client.email.split("@")[0]}
                            </span>
                            <StarRating rating={review.rating} />
                          </div>
                          {review.projects && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {review.projects.title}
                            </p>
                          )}
                          {review.comment && (
                            <p className="text-sm">{review.comment}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Hourly Rate</div>
                <div className="text-muted-foreground">${worker.hourlyRate}/hr</div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Availability</div>
                <div className="text-muted-foreground">{worker.availability}</div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Skills</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {worker.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

