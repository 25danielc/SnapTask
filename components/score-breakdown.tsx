"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertCircle, DollarSign, Award, FileText } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface MatchBreakdown {
  overall: number
  skillMatch: number
  skillMatchDetails: {
    exactMatches: string[]
    semanticMatches: string[]
    missingSkills: string[]
    extraSkills: string[]
    matchRate: number
  }
  budgetFit: number
  budgetDetails: {
    withinRange: boolean
    deviation: number
    hourlyRate: number
    budgetMin?: number
    budgetMax?: number
  }
  experienceMatch: number
  experienceDetails: {
    titleRelevance: number
    experienceKeywords: string[]
    requiredLevel?: string
    workerLevel?: string
  }
  bioRelevance: number
  bioDetails: {
    keywordsFound: string[]
    relevanceScore: number
  }
  breakdownSummary: string
}

interface ScoreBreakdownProps {
  breakdown: MatchBreakdown
  className?: string
}

export function ScoreBreakdown({ breakdown, className }: ScoreBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30"
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/30"
    return "bg-red-100 dark:bg-red-900/30"
  }

  return (
    <Card className={`border ${className || ''}`}>
      <Button
        variant="ghost"
        className="w-full justify-between p-4 h-auto"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`rounded-full px-3 py-1 text-sm font-bold ${getScoreBgColor(breakdown.overall)} ${getScoreColor(breakdown.overall)}`}>
            {breakdown.overall}% Match
          </div>
          <span className="text-sm text-muted-foreground">{breakdown.breakdownSummary}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t pt-4">
          {/* Overall Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Match</span>
              <span className={`text-sm font-bold ${getScoreColor(breakdown.overall)}`}>
                {breakdown.overall}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${getScoreBgColor(breakdown.overall)}`}
                style={{ width: `${breakdown.overall}%` }}
              />
            </div>
          </div>

          {/* Skill Match */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Skill Match</span>
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(breakdown.skillMatch)}`}>
                {breakdown.skillMatch}%
              </span>
            </div>
            <div className="space-y-1.5 pl-6">
              {breakdown.skillMatchDetails.exactMatches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    Exact matches ({breakdown.skillMatchDetails.exactMatches.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {breakdown.skillMatchDetails.exactMatches.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {breakdown.skillMatchDetails.semanticMatches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <AlertCircle className="h-3 w-3 text-yellow-600" />
                    Related skills ({breakdown.skillMatchDetails.semanticMatches.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {breakdown.skillMatchDetails.semanticMatches.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs bg-yellow-100 dark:bg-yellow-900/30">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {breakdown.skillMatchDetails.missingSkills.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <XCircle className="h-3 w-3 text-red-600" />
                    Missing skills ({breakdown.skillMatchDetails.missingSkills.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {breakdown.skillMatchDetails.missingSkills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Budget Fit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Budget Fit</span>
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(breakdown.budgetFit)}`}>
                {breakdown.budgetFit}%
              </span>
            </div>
            <div className="pl-6 space-y-1 text-xs">
              <div className="text-muted-foreground">
                Worker rate: ${breakdown.budgetDetails.hourlyRate}/hr
              </div>
              {(breakdown.budgetDetails.budgetMin !== undefined || breakdown.budgetDetails.budgetMax !== undefined) && (
                <div className="text-muted-foreground">
                  Budget: $
                  {breakdown.budgetDetails.budgetMin !== undefined ? breakdown.budgetDetails.budgetMin : '0'} - $
                  {breakdown.budgetDetails.budgetMax !== undefined ? breakdown.budgetDetails.budgetMax : '∞'}
                </div>
              )}
              {breakdown.budgetDetails.withinRange ? (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Within budget range
                </div>
              ) : breakdown.budgetDetails.deviation > 0 && (
                <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="h-3 w-3" />
                  {breakdown.budgetDetails.deviation > 0 ? '+' : ''}
                  ${Math.abs(breakdown.budgetDetails.deviation).toFixed(2)}/hr deviation
                </div>
              )}
            </div>
          </div>

          {/* Experience Match */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Experience Level</span>
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(breakdown.experienceMatch)}`}>
                {breakdown.experienceMatch}%
              </span>
            </div>
            <div className="pl-6 space-y-1 text-xs">
              {breakdown.experienceDetails.workerLevel && (
                <div className="text-muted-foreground">
                  Worker level: <span className="font-medium capitalize">{breakdown.experienceDetails.workerLevel}</span>
                </div>
              )}
              {breakdown.experienceDetails.requiredLevel && (
                <div className="text-muted-foreground">
                  Required: <span className="font-medium capitalize">{breakdown.experienceDetails.requiredLevel}</span>
                </div>
              )}
              {breakdown.experienceDetails.experienceKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {breakdown.experienceDetails.experienceKeywords.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bio Relevance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Bio Relevance</span>
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(breakdown.bioRelevance)}`}>
                {breakdown.bioRelevance}%
              </span>
            </div>
            {breakdown.bioDetails.keywordsFound.length > 0 && (
              <div className="pl-6">
                <div className="text-xs text-muted-foreground mb-1">
                  Relevant keywords found: {breakdown.bioDetails.keywordsFound.length}
                </div>
                <div className="flex flex-wrap gap-1">
                  {breakdown.bioDetails.keywordsFound.slice(0, 5).map((keyword) => (
                    <Badge key={keyword} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

