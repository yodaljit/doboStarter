-- Add profile settings fields
-- Date: 2024-12-22
-- Description: Add timezone and notification preference fields to profiles table

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN timezone TEXT DEFAULT 'UTC',
ADD COLUMN email_notifications BOOLEAN DEFAULT true,
ADD COLUMN push_notifications BOOLEAN DEFAULT true,
ADD COLUMN marketing_emails BOOLEAN DEFAULT false;

-- Update the profiles update policy to allow updating these new fields
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);