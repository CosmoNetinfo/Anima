'use client'

import React from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { DashboardPatient } from '@/components/dashboard/DashboardPatient'
import { DashboardCaregiver } from '@/components/dashboard/DashboardCaregiver'
import { DashboardNurse } from '@/components/dashboard/DashboardNurse'
import { DashboardDoctor } from '@/components/dashboard/DashboardDoctor'
import { DashboardAdmin } from '@/components/dashboard/DashboardAdmin'

export default function DashboardPage() {
  const { profile, loading, isRole } = useUser()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Profilo non caricato. Effettua nuovamente l\'accesso.</p>
      </div>
    )
  }

  // Seleziona la dashboard in base al ruolo dell'utente
  if (isRole('patient')) {
    return <DashboardPatient />
  }

  if (isRole('caregiver')) {
    return <DashboardCaregiver />
  }

  if (isRole('nurse')) {
    return <DashboardNurse />
  }

  if (isRole('doctor')) {
    return <DashboardDoctor />
  }

  if (isRole('admin', 'super_admin')) {
    return <DashboardAdmin />
  }

  return (
    <div className="text-center py-10">
      <p className="text-muted-foreground">Ruolo non riconosciuto: {profile.role}</p>
    </div>
  )
}
