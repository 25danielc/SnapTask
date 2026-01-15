import { Star, Clock, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

interface WorkerCardProps {
  worker: {
    id: string
    name: string
    title: string
    rating: number
    reviews: number
    hourlyRate: number
    skills: string[]
    availability: string
    image: string
    location?: string | null
  }
}

export function WorkerCard({ worker }: WorkerCardProps) {
  const initials = worker.name
    .split(" ")
    .map((n) => n[0])
    .join("")

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:border-accent/50">
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <Avatar className="h-14 w-14 border-2 border-border">
            <AvatarImage src={worker.image || "/placeholder.svg"} alt={worker.name} />
            <AvatarFallback className="bg-accent text-accent-foreground font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">${worker.hourlyRate}</div>
            <div className="text-xs text-muted-foreground">per hour</div>
          </div>
        </div>

        <h3 className="mb-1 text-lg font-semibold text-foreground">{worker.name}</h3>
        <p className="mb-3 text-sm text-muted-foreground">{worker.title}</p>

        <div className="mb-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-semibold text-foreground">{worker.rating}</span>
            <span className="text-muted-foreground">({worker.reviews})</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs">{worker.availability}</span>
          </div>
          {worker.location && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-xs">{worker.location}</span>
            </div>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {worker.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {worker.skills.length > 3 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              +{worker.skills.length - 3}
            </Badge>
          )}
        </div>

        <Button asChild className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
          <Link href={`/workers/${worker.id}`}>View Profile</Link>
        </Button>
      </div>
    </Card>
  )
}
