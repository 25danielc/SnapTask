"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/back-button"
import { User, Upload, X } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    avatar_url: "",
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/profile")
      return
    }

    if (user) {
      loadProfile()
    }
  }, [user, authLoading, router])

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single()

      if (error) {
        console.error("Error loading profile:", error)
        return
      }

      setProfile(data)
      setFormData({
        full_name: data?.full_name || "",
        bio: data?.bio || "",
        avatar_url: data?.avatar_url || "",
      })
      if (data?.avatar_url) {
        setPreviewUrl(data.avatar_url)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase Storage
    await uploadImage(file)
  }

  async function uploadImage(file: File) {
    if (!user) return

    setUploading(true)
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        // If bucket doesn't exist, try to create it or use public folder
        console.error('Upload error:', uploadError)
        
        // Try uploading to a public bucket or handle the error
        if (uploadError.message.includes('Bucket not found')) {
          toast.error('Storage bucket not configured. Please contact support or use a URL instead.')
          setUploading(false)
          return
        }
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update form data with the new URL
      setFormData({ ...formData, avatar_url: publicUrl })
      toast.success('Image uploaded successfully!')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleRemoveImage() {
    setPreviewUrl(null)
    setFormData({ ...formData, avatar_url: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleSave() {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        throw error
      }

      // Also update worker image_url if user is a worker
      const { data: worker } = await supabase
        .from('workers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (worker && formData.avatar_url) {
        await supabase
          .from('workers')
          .update({ image_url: formData.avatar_url })
          .eq('id', worker.id)
      }

      await loadProfile()
      toast.success("Profile updated successfully!")
    } catch (error: any) {
      console.error("Error saving profile:", error)
      toast.error("Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <div className="mb-4">
          <BackButton href="/dashboard" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const initials = (formData.full_name || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-4">
        <BackButton href="/dashboard" />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your profile information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-border">
                  <AvatarImage src={previewUrl || formData.avatar_url || undefined} />
                  <AvatarFallback className="bg-accent text-accent-foreground text-2xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {previewUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div>
                <div className="font-medium">{formData.full_name || user.email}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_upload">Profile Picture</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  id="avatar_upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>
                {formData.avatar_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      const url = prompt("Enter image URL:", formData.avatar_url)
                      if (url !== null) {
                        setFormData({ ...formData, avatar_url: url })
                        setPreviewUrl(url)
                      }
                    }}
                    className="flex-1"
                  >
                    Or Use URL
                  </Button>
                )}
              </div>
              {formData.avatar_url && (
                <p className="text-xs text-muted-foreground">
                  Current: {formData.avatar_url.length > 50 
                    ? formData.avatar_url.substring(0, 50) + "..." 
                    : formData.avatar_url}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <div className="mt-1 text-sm text-muted-foreground">{user.email}</div>
            </div>
            <div>
              <Label>User ID</Label>
              <div className="mt-1 text-sm text-muted-foreground font-mono">{user.id}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

