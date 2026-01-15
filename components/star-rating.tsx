import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxRating?: number
  className?: string
}

export function StarRating({ rating, maxRating = 5, className }: StarRatingProps) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const isFilled = i < fullStars || (i === fullStars && hasHalfStar)
        return (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              isFilled ? "fill-accent text-accent" : "fill-muted text-muted"
            )}
          />
        )
      })}
    </div>
  )
}

