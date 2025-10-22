-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table
CREATE TABLE teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'trialing', 'past_due', 'canceled')),
  subscription_id TEXT,
  plan_id UUID
);

-- Create team_members table
CREATE TABLE team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer')) NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create subaccounts table
CREATE TABLE subaccounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) NOT NULL DEFAULT 'active',
  UNIQUE(team_id, slug)
);

-- Create team_invitations table
CREATE TABLE team_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'member', 'viewer')) NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(team_id, email)
);

-- Create subscription_plans table
CREATE TABLE subscription_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- Price in cents
  currency TEXT NOT NULL DEFAULT 'USD',
  interval TEXT CHECK (interval IN ('month', 'year')) NOT NULL,
  stripe_price_id TEXT UNIQUE NOT NULL,
  features JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT true
);

-- Add foreign key constraint for plan_id in teams table
ALTER TABLE teams ADD CONSTRAINT teams_plan_id_fkey 
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id);

-- Create indexes for better performance
CREATE INDEX idx_teams_owner_id ON teams(owner_id);
CREATE INDEX idx_teams_slug ON teams(slug);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_subaccounts_team_id ON subaccounts(team_id);
CREATE INDEX idx_subaccounts_slug ON subaccounts(team_id, slug);
CREATE INDEX idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_team_invitations_token ON team_invitations(token);
CREATE INDEX idx_team_invitations_expires_at ON team_invitations(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subaccounts_updated_at BEFORE UPDATE ON subaccounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_invitations_updated_at BEFORE UPDATE ON team_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subaccounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Teams policies
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

CREATE POLICY "Team owners can update their teams" ON teams
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create teams" ON teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Team members policies
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

-- Subaccounts policies
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

-- Team invitations policies
CREATE POLICY "Team owners and admins can view team invitations" ON team_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_invitations.team_id 
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team owners and admins can create team invitations" ON team_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_invitations.team_id 
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team owners and admins can update team invitations" ON team_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_invitations.team_id 
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Invited users can accept invitations" ON team_invitations
  FOR UPDATE USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
    AND accepted_at IS NULL
    AND expires_at > NOW()
  );

-- Subscription plans policies (public read)
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
  FOR SELECT USING (active = true);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create subaccount_settings table
CREATE TABLE subaccount_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subaccount_id UUID REFERENCES subaccounts(id) ON DELETE CASCADE NOT NULL UNIQUE,
  api_enabled BOOLEAN DEFAULT false,
  webhook_url TEXT,
  rate_limit INTEGER DEFAULT 1000,
  allowed_domains TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subaccount_api_keys table
CREATE TABLE subaccount_api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subaccount_id UUID REFERENCES subaccounts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_preview TEXT NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for subaccount_settings
CREATE INDEX idx_subaccount_settings_subaccount_id ON subaccount_settings(subaccount_id);

-- Create indexes for subaccount_api_keys
CREATE INDEX idx_subaccount_api_keys_subaccount_id ON subaccount_api_keys(subaccount_id);
CREATE INDEX idx_subaccount_api_keys_key_hash ON subaccount_api_keys(key_hash);

-- Create triggers for updated_at
CREATE TRIGGER update_subaccount_settings_updated_at
  BEFORE UPDATE ON subaccount_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for subaccount_settings
ALTER TABLE subaccount_settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS for subaccount_api_keys
ALTER TABLE subaccount_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for subaccount_settings
CREATE POLICY "Users can view subaccount settings for their team's subaccounts" ON subaccount_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subaccounts s
      JOIN team_members tm ON s.team_id = tm.team_id
      WHERE s.id = subaccount_settings.subaccount_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Team admins can manage subaccount settings" ON subaccount_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM subaccounts s
      JOIN team_members tm ON s.team_id = tm.team_id
      WHERE s.id = subaccount_settings.subaccount_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- RLS policies for subaccount_api_keys
CREATE POLICY "Users can view API keys for their team's subaccounts" ON subaccount_api_keys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subaccounts s
      JOIN team_members tm ON s.team_id = tm.team_id
      WHERE s.id = subaccount_api_keys.subaccount_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Team admins can manage API keys" ON subaccount_api_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM subaccounts s
      JOIN team_members tm ON s.team_id = tm.team_id
      WHERE s.id = subaccount_api_keys.subaccount_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_team_id ON audit_logs(team_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit_logs
CREATE POLICY "Users can view audit logs for their teams" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = audit_logs.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, interval, stripe_price_id, features) VALUES
('Starter', 'Perfect for small teams getting started', 999, 'month', 'price_starter_monthly', '["Up to 5 team members", "Basic analytics", "Email support", "5 subaccounts"]'),
('Professional', 'For growing businesses', 2999, 'month', 'price_pro_monthly', '["Up to 25 team members", "Advanced analytics", "Priority support", "Unlimited subaccounts", "Custom integrations"]'),
('Enterprise', 'For large organizations', 9999, 'month', 'price_enterprise_monthly', '["Unlimited team members", "Enterprise analytics", "24/7 phone support", "Unlimited subaccounts", "Custom integrations", "SLA guarantee"]');