import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function getCurrentUser(client?: any) {
  const supabase = client ?? createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}