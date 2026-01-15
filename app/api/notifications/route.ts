import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all notifications for this user
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select(`
        *,
        matches (
          id,
          status,
          projects (
            id,
            title
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    return NextResponse.json({ 
      notifications: notifications || [], 
      unreadCount: unreadCount || 0 
    })
  } catch (error: any) {
    console.error('Notifications API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

