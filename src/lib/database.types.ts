export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
          owner_id: string
          stripe_customer_id: string | null
          subscription_status: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled' | null
          subscription_id: string | null
          plan_id: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
          owner_id: string
          stripe_customer_id?: string | null
          subscription_status?: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled' | null
          subscription_id?: string | null
          plan_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
          owner_id?: string
          stripe_customer_id?: string | null
          subscription_status?: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled' | null
          subscription_id?: string | null
          plan_id?: string | null
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          created_at?: string
          updated_at?: string
        }
      }
      subaccounts: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          team_id: string
          created_at: string
          updated_at: string
          created_by: string
          status: 'active' | 'inactive' | 'suspended'
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          team_id: string
          created_at?: string
          updated_at?: string
          created_by: string
          status?: 'active' | 'inactive' | 'suspended'
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          team_id?: string
          created_at?: string
          updated_at?: string
          created_by?: string
          status?: 'active' | 'inactive' | 'suspended'
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          global_role: 'super_admin' | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          global_role?: 'super_admin' | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          global_role?: 'super_admin' | null
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          currency: string
          interval: 'month' | 'year'
          stripe_price_id: string
          features: Json
          created_at: string
          updated_at: string
          active: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          currency: string
          interval: 'month' | 'year'
          stripe_price_id: string
          features: Json
          created_at?: string
          updated_at?: string
          active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          currency?: string
          interval?: 'month' | 'year'
          stripe_price_id?: string
          features?: Json
          created_at?: string
          updated_at?: string
          active?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}