'use client'

import { useEffect } from 'react'
import { initUserProfile } from '@/lib/stores/userStore'

/**
 * Provider che avvia il fetch del profilo utente una sola volta per tutta l'app.
 * Va messo nel layout root (es. layout.tsx), NON in ogni componente.
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initUserProfile()
  }, [])

  return <>{children}</>
}
