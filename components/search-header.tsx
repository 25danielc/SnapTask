"use client"

import { Search, User, Zap, Grid3x3, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/hooks/use-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SearchHeaderProps {
  viewMode: "browse" | "instant"
  onViewModeChange: (mode: "browse" | "instant") => void
}

export function SearchHeader({ viewMode, onViewModeChange }: SearchHeaderProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.refresh()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
          </div>
          <span className="text-xl font-semibold tracking-tight">SnapTask</span>
        </div>

        <div className="hidden sm:flex items-center gap-1 rounded-lg bg-secondary p-1">
          <Button
            variant={viewMode === "browse" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("browse")}
            className="gap-2 h-8"
          >
            <Grid3x3 className="h-4 w-4" />
            Browse
          </Button>
          <Button
            variant={viewMode === "instant" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("instant")}
            className="gap-2 h-8"
          >
            <Zap className="h-4 w-4" />
            Instant Match
          </Button>
        </div>

        {viewMode === "browse" && (
          <div className="hidden flex-1 max-w-2xl md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for skills, expertise, or project needs..."
                className="h-11 w-full pl-10 pr-4 bg-secondary/50 border-0 focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          <Button variant="ghost" className="hidden sm:inline-flex" asChild>
            <Link href="/become-worker">Become a Worker</Link>
          </Button>
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{user.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link href="/auth/signup">Sign up</Link>
              </Button>
              <Button size="icon" variant="ghost" className="sm:hidden" asChild>
                <Link href="/auth/login">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Account</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="sm:hidden px-4 pb-3 pt-2 flex gap-2">
        <Button
          variant={viewMode === "browse" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewModeChange("browse")}
          className="flex-1 gap-2"
        >
          <Grid3x3 className="h-4 w-4" />
          Browse
        </Button>
        <Button
          variant={viewMode === "instant" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewModeChange("instant")}
          className="flex-1 gap-2"
        >
          <Zap className="h-4 w-4" />
          Instant Match
        </Button>
      </div>

      {viewMode === "browse" && (
        <div className="md:hidden px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search skills or needs..."
              className="h-11 w-full pl-10 pr-4 bg-secondary/50 border-0"
            />
          </div>
        </div>
      )}
    </header>
  )
}
