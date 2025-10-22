-- Final fix for infinite recursion in profiles RLS policy
-- Date: 2024-12-22
-- Description: Remove all problematic recursive policies and create non-recursive alternatives

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create non-recursive policies for profiles table
-- 1. Users can always view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 2. Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- For super admin functionality, we'll handle it in the application layer
-- by using the service role client when needed, rather than RLS policies
-- This avoids the recursion issue entirely

-- Create a function to check if a user is a super admin (for application use)
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND global_role = 'super_admin'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;