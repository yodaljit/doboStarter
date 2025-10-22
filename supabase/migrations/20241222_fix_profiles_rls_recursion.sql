-- Fix infinite recursion in profiles RLS policy
-- Date: 2024-12-22
-- Description: Remove the recursive super admin policy and replace with a simpler approach

-- Drop the problematic policy
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;

-- Create a simpler policy that doesn't cause recursion
-- We'll handle super_admin access in the application layer instead of RLS
-- This allows users to view their own profile, and super_admin access will be handled by the app
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Ensure the policy is recreated if it was dropped earlier
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- For super_admin functionality, we'll bypass RLS in the application code
-- by using the service role key when needed, rather than trying to handle it in RLS