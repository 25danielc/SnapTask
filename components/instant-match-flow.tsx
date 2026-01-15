"use client"

import { useState } from "react"
import { ArrowLeft, Sparkles, Clock, Zap, DollarSign, MapPin, ChevronDown, ChevronUp, Shield, Car, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { StarRating } from "@/components/star-rating"
import { transformWorkerData } from "@/lib/utils/worker-data"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { MatchingLoadingScreen } from "@/components/matching-loading-screen"
import { ScoreBreakdown, type MatchBreakdown } from "@/components/score-breakdown"

interface InstantMatchFlowProps {
  onBack: () => void
}

export function InstantMatchFlow({ onBack }: InstantMatchFlowProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [description, setDescription] = useState("")
  const [budgetMin, setBudgetMin] = useState("")
  const [budgetMax, setBudgetMax] = useState("")
  const [location, setLocation] = useState("")
  const [timeline, setTimeline] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [safetyFeatures, setSafetyFeatures] = useState("")
  const [transportationProvided, setTransportationProvided] = useState(false)
  const [requiresLicense, setRequiresLicense] = useState(false)
  const [requiresInsurance, setRequiresInsurance] = useState(false)
  const [workEnvironment, setWorkEnvironment] = useState("")
  const [equipmentProvided, setEquipmentProvided] = useState("")
  
  const [isMatching, setIsMatching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [matches, setMatches] = useState<any[]>([])
  const [savedProjectData, setSavedProjectData] = useState<any>(null)
  const [processingMatch, setProcessingMatch] = useState<string | null>(null)

  const handleMatch = async () => {
    if (!description.trim()) return

    setIsMatching(true)
    try {
      const projectData = {
        description,
        budget_min: budgetMin ? parseFloat(budgetMin) : null,
        budget_max: budgetMax ? parseFloat(budgetMax) : null,
        location: location.trim() || null,
        timeline: timeline.trim() || null,
        safety_features: showAdvanced ? (safetyFeatures.trim() || null) : null,
        transportation_provided: showAdvanced ? transportationProvided : null,
        requires_license: showAdvanced ? requiresLicense : null,
        requires_insurance: showAdvanced ? requiresInsurance : null,
        work_environment: showAdvanced ? (workEnvironment.trim() || null) : null,
        equipment_provided: showAdvanced ? (equipmentProvided.trim() || null) : null,
      }

      // Store project data for later use in Request Match
      setSavedProjectData(projectData)

      let response: Response
      try {
        response = await fetch("/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData),
        })
      } catch (fetchError: any) {
        if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
          throw new Error("Network error. Please check your connection and try again.")
        }
        throw fetchError
      }

      if (!response.ok) {
        let errorMessage = "Failed to find matches"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = response.statusText || `Server error (${response.status})`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.project) {
        toast.info("Showing matches. Sign in to create a project and assign workers.")
      } else {
        const matchCount = (data.matches || []).length
        if (matchCount > 0) {
          toast.success(`${matchCount} worker${matchCount > 1 ? 's' : ''} matched with your project! They will be notified to review the opportunity.`)
        }
      }

      if (!data.matches || data.matches.length === 0) {
        toast.info("No matches found. Try adjusting your description.")
      }
      
      const transformedMatches = (data.matches || []).map((m: any) => {
        const workerData = transformWorkerData(m.worker || {})
        return {
          ...workerData,
          id: m.id,
          matchScore: m.match_score || 0,
          responseTime: "~5 min",
          status: m.status || 'pending',
          breakdown: m.breakdown as MatchBreakdown | undefined, // Include breakdown
          project_id: m.project_id,
          worker_id: m.worker_id,
        }
      })

      setMatches(transformedMatches)
      setShowResults(true)
    } catch (error: any) {
      console.error("Error finding matches:", error)
      
      let errorMessage = "Failed to find matches. Please try again."
      if (error.message) {
        errorMessage = error.message
        
        if (error.message.includes('Supabase project is currently unavailable') || 
            error.message.includes('paused') ||
            error.message.includes('SUPABASE_DOWN')) {
          errorMessage = "Database is currently unavailable. Your Supabase project may be paused. Please check your Supabase dashboard."
        }
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again."
      }
      
      toast.error(errorMessage)
    } finally {
      setIsMatching(false)
    }
  }

  const handleRequestMatch = async (worker: any) => {
    // Check if user is logged in
    if (!user && !authLoading) {
      // Redirect to login with redirect back
      const currentUrl = window.location.pathname + window.location.search
      router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`)
      toast.info("Please sign in to request a match")
      return
    }

    if (authLoading) {
      toast.info("Please wait...")
      return
    }

    setProcessingMatch(worker.id)

    try {
      // Check if match has a temp ID (not saved in database yet)
      const isTempMatch = worker.id?.startsWith('temp-')

      if (isTempMatch && savedProjectData) {
        // Need to create project and match - call the API again (this time authenticated)
        const response = await fetch("/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savedProjectData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to create match")
        }

        const data = await response.json()
        
        // Find the match for this worker in the response
        const createdMatch = data.matches?.find((m: any) => 
          m.worker_id === worker.worker_id || 
          m.worker?.id === worker.worker_id ||
          (m.worker && transformWorkerData(m.worker).id === worker.worker_id)
        )
        
        if (createdMatch?.project_id) {
          toast.success("Match created! The worker has been notified.")
          // Redirect to projects page to see the created project
          router.push("/dashboard/projects")
        } else {
          toast.success("Match request sent!")
        }
      } else if (worker.project_id) {
        // Match already exists, just show success and redirect to project
        toast.success("Match already created!")
        router.push("/dashboard/projects")
      } else {
        toast.success("Match request sent!")
      }
    } catch (error: any) {
      console.error("Error requesting match:", error)
      toast.error(error.message || "Failed to request match. Please try again.")
    } finally {
      setProcessingMatch(null)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {isMatching && <MatchingLoadingScreen />}
      {!showResults ? (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <Button variant="ghost" onClick={onBack} className="mb-6 -ml-2 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Browse
          </Button>

          <div className="text-center mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
              <Zap className="h-4 w-4" />
              Instant AI Matching
            </div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              Describe Your Project Need
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Tell us what you need help with, and we'll instantly match you with the best workers
            </p>
          </div>

          <Card className="p-6 bg-card border-border">
            <div className="space-y-6">
              <div>
                <Label htmlFor="project-description" className="mb-2">
                  What do you need help with? *
                </Label>
                <Textarea
                  id="project-description"
                  placeholder="Example: I need a developer to build a React dashboard with real-time data visualization, user authentication, and API integration..."
                  className="min-h-[200px] resize-none text-base bg-secondary/30 border-border"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="budget-min">Budget Range (Min)</Label>
                  <div className="relative mt-1.5">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="budget-min"
                      type="number"
                      placeholder="0"
                      className="pl-9"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="budget-max">Budget Range (Max)</Label>
                  <div className="relative mt-1.5">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="budget-max"
                      type="number"
                      placeholder="10000"
                      className="pl-9"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <div className="relative mt-1.5">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="location"
                      type="text"
                      placeholder="City, State or Address"
                      className="pl-9"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="timeline">Timeline / When Needed</Label>
                  <div className="relative mt-1.5">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="timeline"
                      type="text"
                      placeholder="e.g., Within 2 weeks, ASAP, etc."
                      className="pl-9"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto font-normal"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <span className="flex items-center gap-2">
                    Advanced Options (Optional)
                  </span>
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 pt-4 border-t">
                    <div>
                      <Label htmlFor="safety-features">Safety Features Required</Label>
                      <Textarea
                        id="safety-features"
                        placeholder="Describe any safety requirements, equipment, or protocols needed..."
                        className="mt-1.5 min-h-[80px] resize-none bg-secondary/30"
                        value={safetyFeatures}
                        onChange={(e) => setSafetyFeatures(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="transportation"
                          className="h-4 w-4 rounded border-input"
                          checked={transportationProvided}
                          onChange={(e) => setTransportationProvided(e.target.checked)}
                        />
                        <Label htmlFor="transportation" className="cursor-pointer flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          Transportation Provided
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="license"
                          className="h-4 w-4 rounded border-input"
                          checked={requiresLicense}
                          onChange={(e) => setRequiresLicense(e.target.checked)}
                        />
                        <Label htmlFor="license" className="cursor-pointer flex items-center gap-2">
                          <FileCheck className="h-4 w-4" />
                          Requires License
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="insurance"
                          className="h-4 w-4 rounded border-input"
                          checked={requiresInsurance}
                          onChange={(e) => setRequiresInsurance(e.target.checked)}
                        />
                        <Label htmlFor="insurance" className="cursor-pointer flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Requires Insurance
                        </Label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="work-environment">Work Environment</Label>
                      <Input
                        id="work-environment"
                        type="text"
                        placeholder="e.g., Indoor, Outdoor, Remote, Hybrid"
                        className="mt-1.5"
                        value={workEnvironment}
                        onChange={(e) => setWorkEnvironment(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="equipment">Equipment Provided</Label>
                      <Textarea
                        id="equipment"
                        placeholder="List any equipment, tools, or materials you can provide..."
                        className="mt-1.5 min-h-[80px] resize-none bg-secondary/30"
                        value={equipmentProvided}
                        onChange={(e) => setEquipmentProvided(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  size="lg"
                  className="flex-1 h-12 gap-2"
                  onClick={handleMatch}
                  disabled={!description.trim() || isMatching}
                >
                  {isMatching ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Find Matches
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Card className="p-4 bg-secondary/30 border-border">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-accent/10 p-2">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Instant Results</h3>
                  <p className="text-sm text-muted-foreground">AI matches you in seconds</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-secondary/30 border-border">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-accent/10 p-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Smart Matching</h3>
                  <p className="text-sm text-muted-foreground">Perfect skill alignment</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-secondary/30 border-border">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-accent/10 p-2">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Quick Response</h3>
                  <p className="text-sm text-muted-foreground">Workers reply in minutes</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={() => setShowResults(false)} className="mb-6 -ml-2 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Edit Description
          </Button>

          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
              <Sparkles className="h-4 w-4" />
              {matches.length} Perfect Matches Found
            </div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight">Your Top Matches</h1>
            <p className="text-muted-foreground">Based on your project needs, these workers are the best fit</p>
          </div>

          <div className="space-y-4">
            {matches.map((worker) => (
              <Card key={worker.id} className="p-6 bg-card border-border hover:border-accent/50 transition-colors">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-2 border-accent">
                      <AvatarImage src={worker.image || "/placeholder.svg"} alt={worker.name} />
                      <AvatarFallback className="text-lg">{worker.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full px-2.5 py-0.5 text-xs font-bold">
                      {worker.matchScore}%
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{worker.name}</h3>
                        <p className="text-muted-foreground">{worker.title}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold">${worker.hourlyRate}</div>
                          <div className="text-xs text-muted-foreground">per hour</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {worker.skills.map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="bg-secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                      <div className="flex items-center gap-1.5">
                        <StarRating rating={worker.rating} />
                        <span className="font-medium">{worker.rating}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {worker.availability}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Zap className="h-4 w-4" />
                        Responds {worker.responseTime}
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    {worker.breakdown && typeof worker.breakdown === 'object' && (
                      <div className="mb-4">
                        <ScoreBreakdown breakdown={worker.breakdown as MatchBreakdown} />
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 sm:flex-none"
                        onClick={() => handleRequestMatch(worker)}
                        disabled={processingMatch === worker.id || authLoading}
                      >
                        {processingMatch === worker.id ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" />
                            Processing...
                          </>
                        ) : (
                          "Request Match"
                        )}
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/workers/${worker.worker_id || worker.id}`}>View Profile</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={onBack}>
              Browse All Workers Instead
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
