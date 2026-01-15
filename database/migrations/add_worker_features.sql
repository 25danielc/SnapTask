-- Add location field to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location TEXT;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match_created', 'match_accepted', 'match_rejected', 'message')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- RLS Policies for messages
CREATE POLICY "Users can view messages for their matches" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = messages.match_id
    AND (
      EXISTS (SELECT 1 FROM workers w WHERE w.id = m.worker_id AND w.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM projects p WHERE p.id = m.project_id AND p.client_id = auth.uid())
    )
  )
);
CREATE POLICY "Users can create messages for their matches" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = messages.match_id
    AND (
      EXISTS (SELECT 1 FROM workers w WHERE w.id = m.worker_id AND w.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM projects p WHERE p.id = m.project_id AND p.client_id = auth.uid())
    )
  )
);

