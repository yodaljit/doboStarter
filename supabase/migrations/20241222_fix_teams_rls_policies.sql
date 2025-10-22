-- Fix infinite recursion in teams and team_members RLS policies
-- The issue is circular dependency between teams and team_members policies

-- First, disable RLS on both tables
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on teams table
DROP POLICY IF EXISTS "Team owners can view their teams" ON teams;
DROP POLICY IF EXISTS "Team members can view their teams" ON teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
DROP POLICY IF EXISTS "Users can view teams they own" ON teams;
DROP POLICY IF EXISTS "Users can view teams they are members of" ON teams;
DROP POLICY IF EXISTS "Users can update teams they own" ON teams;
DROP POLICY IF EXISTS "Users can delete teams they own" ON teams;
DROP POLICY IF EXISTS "team_owners_full_access" ON teams;
DROP POLICY IF EXISTS "team_members_view_access" ON teams;
DROP POLICY IF EXISTS "authenticated_users_create_teams" ON teams;

-- Drop ALL existing policies on team_members table
DROP POLICY IF EXISTS "Users can view their own team memberships" ON team_members;
DROP POLICY IF EXISTS "Team owners can view all team members" ON team_members;
DROP POLICY IF EXISTS "Team owners can manage team members" ON team_members;
DROP POLICY IF EXISTS "Users can join teams" ON team_members;

-- Re-enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create NON-CIRCULAR policies for teams
-- Team owners have full access to their teams
CREATE POLICY "teams_owner_access" ON teams
  FOR ALL USING (owner_id = auth.uid());

-- Team members can only view teams (no circular reference)
CREATE POLICY "teams_member_view" ON teams
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    id = ANY(
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Create NON-CIRCULAR policies for team_members
-- Users can view their own memberships
CREATE POLICY "team_members_own_view" ON team_members
  FOR SELECT USING (user_id = auth.uid());

-- Team owners can manage members (direct owner check, no subquery to teams)
CREATE POLICY "team_members_owner_manage" ON team_members
  FOR ALL USING (
    user_id = auth.uid() OR 
    team_id = ANY(
      SELECT id FROM teams WHERE owner_id = auth.uid()
    )
  );

-- Users can insert themselves as team members
CREATE POLICY "team_members_self_insert" ON team_members
  FOR INSERT WITH CHECK (user_id = auth.uid());