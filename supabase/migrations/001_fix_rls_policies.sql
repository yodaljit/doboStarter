-- Migration: Fix RLS Policy Recursion Issues
-- Date: 2024-12-22
-- Description: Fixes infinite recursion in RLS policies and ensures proper profile access

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Team members can view their teams" ON teams;
DROP POLICY IF EXISTS "Team members can view team membership" ON team_members;
DROP POLICY IF EXISTS "Team owners and admins can manage members" ON team_members;
DROP POLICY IF EXISTS "Team members can view subaccounts" ON subaccounts;
DROP POLICY IF EXISTS "Team admins can manage subaccounts" ON subaccounts;
DROP POLICY IF EXISTS "Team owners can view subaccounts" ON subaccounts;
DROP POLICY IF EXISTS "Team owners can manage subaccounts" ON subaccounts;

-- Add missing profile INSERT policy
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Fix teams policies to prevent recursion
CREATE POLICY "Team owners can view their teams" ON teams
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Team members can view their teams" ON teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = teams.id 
      AND team_members.user_id = auth.uid()
    )
  );

-- Fix team_members policies to prevent recursion
CREATE POLICY "Users can view their own team memberships" ON team_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Team owners can view all team members" ON team_members
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage team members" ON team_members
  FOR ALL USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can join teams" ON team_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Fix subaccounts policies to prevent recursion and allow team member access
CREATE POLICY "Team members can view subaccounts" ON subaccounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = subaccounts.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners and admins can manage subaccounts" ON subaccounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = subaccounts.team_id 
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subaccounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;