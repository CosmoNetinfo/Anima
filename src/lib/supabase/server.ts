import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Gestisce l'errore se chiamato da un Server Component dove i cookie non possono essere modificati
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Gestisce l'errore se chiamato da un Server Component
          }
        },
      },
    }
  )
}

/**
 * Utility to get the active role and profile, taking into account any debug overrides set via cookies
 */
export async function getActiveRoleAndProfile(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null, role: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, structures(*)')
    .eq('id', user.id)
    .single()

  if (!profile) return { user, profile: null, role: null }

  let activeRole = profile.role
  let activeProfile = profile

  if (process.env.NODE_ENV === 'development') {
    const cookieStore = await cookies()
    const overrideRole = cookieStore.get('anima-override-role')?.value
    if (overrideRole) {
      activeRole = overrideRole
      activeProfile = { ...profile, role: overrideRole }
    }
  }

  return { user, profile: activeProfile, role: activeRole }
}


