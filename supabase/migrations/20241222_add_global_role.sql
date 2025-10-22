-- Add global role field to profiles table
-- Date: 2024-12-22
-- Description: Add global_role field to support super_admin users who have access across all teams

-- Add global_role column to profiles table
ALTER TABLE profiles 
ADD COLUMN global_role TEXT CHECK (global_role IN ('super_admin')) DEFAULT NULL;

-- Create index for performance
CREATE INDEX idx_profiles_global_role ON profiles(global_role) WHERE global_role IS NOT NULL;

-- Update RLS policies to allow super_admin access
-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND global_role = 'super_admin'
    )
  );

-- Super admins can view all teams
CREATE POLICY "Super admins can view all teams" ON teams
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    id = ANY(
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND global_role = 'super_admin'
    )
  );

-- Super admins can manage all teams
CREATE POLICY "Super admins can manage all teams" ON teams
  FOR ALL USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND global_role = 'super_admin'
    )
  );

-- Super admins can view all team members
CREATE POLICY "Super admins can view all team members" ON team_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    team_id = ANY(
      SELECT id FROM teams WHERE owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND global_role = 'super_admin'
    )
  );

-- Super admins can manage all team members
CREATE POLICY "Super admins can manage all team members" ON team_members
  FOR ALL USING (
    user_id = auth.uid() OR 
    team_id = ANY(
      SELECT id FROM teams WHERE owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND global_role = 'super_admin'
    )
  );

-- Super admins can view all subaccounts
CREATE POLICY "Super admins can view all subaccounts" ON subaccounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = subaccounts.team_id 
      AND team_members.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND global_role = 'super_admin'
    )
  );

-- Super admins can manage all subaccounts
CREATE POLICY "Super admins can manage all subaccounts" ON subaccounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = subaccounts.team_id 
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND global_role = 'super_admin'
    )
  );