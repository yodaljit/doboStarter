'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Extract and validate inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  if (!data.email || !data.password) {
    redirect('/auth/signin?error=missing-fields')
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Login error:', error.message)
    redirect(`/auth/signin?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // Extract and validate inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  if (!data.email || !data.password) {
    redirect('/auth/signup?error=missing-fields')
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.error('Signup error:', error.message)
    redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/auth/signin?message=check-email')
}

export async function signOut() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Sign out error:', error.message)
    return
  }
  
  revalidatePath('/', 'layout')
  redirect('/')
}