-- Force drop all recursive super admin policies
-- Date: 2024-12-22
-- Description: Forcefully remove all super admin policies that reference profiles table to prevent recursion

-- Drop all super admin policies that cause recursion
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all teams" ON teams;
DROP POLICY IF EXISTS "Super admins can manage all teams" ON teams;
DROP POLICY IF EXISTS "Super admins can view all team members" ON team_members;
DROP POLICY IF EXISTS "Super admins can manage all team members" ON team_members;
DROP POLICY IF EXISTS "Super admins can view all subaccounts" ON subaccounts;
DROP POLICY IF EXISTS "Super admins can manage all subaccounts" ON subaccounts;

-- Note: Super admin functionality will be handled at the application layer
-- using service role clients instead of RLS policies to avoid recursion