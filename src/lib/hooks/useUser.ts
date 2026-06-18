import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDebugStore } from '@/lib/stores/debugStore'
import type { Profile } from '@/types'

export function useUser() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { overrideRole } = useDebugStore()

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      // Recupera il profilo dal database
      let { data, error } = await supabase
        .from('profiles')
        .select('*, structures(*)')
        .eq('id', user.id)
        .single()

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

    fetchProfile()

    // Ascolta i cambiamenti dello stato di autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setProfile(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          fetchProfile()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const activeRole = overrideRole || profile?.role
  const isRole = (...roles: string[]) => (activeRole ? roles.includes(activeRole) : false)
  const isPatient = () => isRole('patient')
  const isCaregiver = () => isRole('caregiver')
  const isNurse = () => isRole('nurse')
  const isDoctor = () => isRole('doctor')
  const isAdmin = () => isRole('admin', 'super_admin')
  const isStaff = () => isRole('admin', 'super_admin', 'doctor', 'nurse')
  const canEdit = () => isStaff()

  // Se c'è un override, restituiamo un profilo modificato fittiziamente
  const effectiveProfile = profile && overrideRole 
    ? { ...profile, role: overrideRole } 
    : profile

  return {
    profile: effectiveProfile,
    loading,
    isRole,
    isPatient,
    isCaregiver,
    isNurse,
    isDoctor,
    isAdmin,
    isStaff,
    canEdit,
  }
}

