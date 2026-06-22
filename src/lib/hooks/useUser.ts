import { useCallback } from 'react'
import { useUserStore } from '@/lib/stores/userStore'
import { useDebugStore } from '@/lib/stores/debugStore'
import type { Profile, UserRole } from '@/types'

/**
 * Hook useUser — legge dallo store singleton.
 * NON fa fetch direttamente: il fetch avviene una sola volta in UserProvider.
 */
export function useUser() {
  const { profile: rawProfile, loading } = useUserStore()
  const { overrideRole } = useDebugStore()

  const activeRole: UserRole | undefined = (overrideRole ?? rawProfile?.role) as UserRole | undefined

  const isRole = useCallback((...roles: string[]) => (activeRole ? roles.includes(activeRole) : false), [activeRole])
  const isPatient   = useCallback(() => isRole('patient'), [isRole])
  const isCaregiver = useCallback(() => isRole('caregiver'), [isRole])
  const isNurse     = useCallback(() => isRole('nurse'), [isRole])
  const isDoctor    = useCallback(() => isRole('doctor'), [isRole])
  const isAdmin     = useCallback(() => isRole('admin', 'super_admin'), [isRole])
  const isStaff     = useCallback(() => isRole('admin', 'super_admin', 'doctor', 'nurse'), [isRole])
  const canEdit     = useCallback(() => isStaff(), [isStaff])

  // Profilo effettivo con ruolo override applicato
  const profile: Profile | null = rawProfile && overrideRole
    ? { ...rawProfile, role: overrideRole }
    : rawProfile

  return {
    profile,
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

