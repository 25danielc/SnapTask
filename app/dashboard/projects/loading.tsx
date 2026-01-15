import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectsLoading() {
  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-4">
        <Skeleton className="h-10 w-20" />
      </div>
      <Skeleton className="h-64 w-full mb-4" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

