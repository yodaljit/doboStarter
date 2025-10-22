-- Fix for infinite recursion in teams, team_members and subaccounts RLS policies
-- Date: 2024-12-22
-- Description: Remove problematic recursive policies that reference profiles table

-- Drop the problematic super admin policies that reference profiles table
DROP POLICY IF EXISTS "Super admins can view all teams" ON teams;
DROP POLICY IF EXISTS "Super admins can manage all teams" ON teams;
DROP POLICY IF EXISTS "Super admins can view all team members" ON team_members;
DROP POLICY IF EXISTS "Super admins can manage all team members" ON team_members;
DROP POLICY IF EXISTS "Super admins can view all subaccounts" ON subaccounts;
DROP POLICY IF EXISTS "Super admins can manage all subaccounts" ON subaccounts;

-- Keep the existing non-recursive policies for teams
-- These should already exist and work fine:
-- - Policies that allow owners and team members to view/manage teams

-- Keep the existing non-recursive policies for team_members
-- These should already exist and work fine:
-- - "Users can view their own team memberships" 
-- - "Team owners can view all team members"
-- - "Team owners can manage team members"
-- - "Users can join teams"

-- Keep the existing non-recursive policies for subaccounts
-- These should already exist and work fine:
-- - Policies that allow team members to view/manage subaccounts based on team membership

-- For super admin functionality on these tables, we'll handle it in the application layer
-- by using the service role client when needed, rather than RLS policies
-- This avoids the recursion issue entirely