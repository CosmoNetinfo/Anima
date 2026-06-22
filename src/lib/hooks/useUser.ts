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

  const isRole = (...roles: string[]) => (activeRole ? roles.includes(activeRole) : false)
  const isPatient   = () => isRole('patient')
  const isCaregiver = () => isRole('caregiver')
  const isNurse     = () => isRole('nurse')
  const isDoctor    = () => isRole('doctor')
  const isAdmin     = () => isRole('admin', 'super_admin')
  const isStaff     = () => isRole('admin', 'super_admin', 'doctor', 'nurse')
  const canEdit     = () => isStaff()

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
