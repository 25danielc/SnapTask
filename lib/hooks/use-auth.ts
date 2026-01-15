"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

// Cache user to avoid repeated lookups
let cachedUser: User | null | undefined = undefined
let cachedPromise: Promise<{ user: User | null }> | null = null

export function useAuth() {
  const [user, setUser] = useState<User | null>(cachedUser ?? null)
  const [loading, setLoading] = useState(cachedUser === undefined)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true

    // If we have cached user, use it immediately
    if (cachedUser !== undefined) {
      setUser(cachedUser)
      setLoading(false)
      
      // Still listen for changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
          cachedUser = session?.user ?? null
          setUser(cachedUser)
        }
      })

      return () => {
        mounted = false
        subscription.unsubscribe()
      }
    }

    // Otherwise, fetch user (share promise across hooks)
    if (!cachedPromise) {
      cachedPromise = supabase.auth.getUser()
    }

    cachedPromise.then(({ data: { user } }) => {
      if (mounted) {
        cachedUser = user
        setUser(user)
        setLoading(false)
      }
      cachedPromise = null
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        cachedUser = session?.user ?? null
        setUser(cachedUser)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return { user, loading }
}

