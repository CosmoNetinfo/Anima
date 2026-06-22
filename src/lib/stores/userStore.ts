import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

/**
 * Store singleton per l'utente.
 * Una sola chiamata getUser() per tutta l'app, condivisa da tutti i componenti.
 */
interface UserStoreState {
  profile: Profile | null
  loading: boolean
  initialized: boolean
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
}

export const useUserStore = create<UserStoreState>((set) => ({
  profile: null,
  loading: true,
  initialized: false,
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
}))

/**
 * Inizializza il profilo utente una sola volta.
 * Chiamato una sola volta da UserProvider nel layout root.
 */
export async function initUserProfile() {
  const { initialized, setProfile, setLoading, setInitialized } = useUserStore.getState()
  if (initialized) return

  setInitialized(true)
  const supabase = createClient()

  const fetchProfile = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const { data: dbProfile, error } = await supabase
      .from('profiles')
      .select('*, structures(*)')
      .eq('id', user.id)
      .single()

    let data = dbProfile

    // Auto-healing: crea profilo se mancante
    if (!data || error) {
      const fallbackName = user.email?.split('@')[0] ?? 'Utente'
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: fallbackName,
          role: 'caregiver',
          is_active: true,
          large_font_mode: false,
          motion_reduced: false,
          high_contrast_mode: false,
          emergency_contacts: [],
        })
        .select('*, structures(*)')
        .single()

      if (!insertError && newProfile) {
        data = newProfile
      }
    }

    setProfile(data)
    setLoading(false)
  }

  await fetchProfile()

  // Ascolta i cambiamenti di autenticazione (un solo listener globale)
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      setProfile(null)
      setLoading(false)
    } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
      fetchProfile()
    }
  })
}
