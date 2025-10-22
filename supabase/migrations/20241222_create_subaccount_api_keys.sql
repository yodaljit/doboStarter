-- Create subaccount_api_keys table
CREATE TABLE subaccount_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_preview TEXT NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for subaccount_api_keys
CREATE INDEX idx_subaccount_api_keys_subaccount_id ON subaccount_api_keys(subaccount_id);
CREATE INDEX idx_subaccount_api_keys_key_hash ON subaccount_api_keys(key_hash);

-- Create updated_at trigger
CREATE TRIGGER update_subaccount_api_keys_updated_at
  BEFORE UPDATE ON subaccount_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for subaccount_api_keys
ALTER TABLE subaccount_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for subaccount_api_keys
CREATE POLICY "Users can view API keys for their team's subaccounts" ON subaccount_api_keys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subaccounts s
      JOIN team_members tm ON tm.team_id = s.team_id
      WHERE s.id = subaccount_api_keys.subaccount_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can manage API keys" ON subaccount_api_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM subaccounts s
      JOIN team_members tm ON tm.team_id = s.team_id
      WHERE s.id = subaccount_api_keys.subaccount_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Super admins can manage all API keys
CREATE POLICY "Super admins can manage all API keys" ON subaccount_api_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role = 'super_admin'
    )
  );