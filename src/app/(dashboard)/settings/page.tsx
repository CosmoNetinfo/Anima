'use client'

import React from 'react'
import { useUser } from '@/lib/hooks/useUser'

export default function SettingsPage() {
  const { profile } = useUser()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Impostazioni</h2>
      <p className="text-muted-foreground">La gestione delle impostazioni e preferenze di accessibilità (Fase 12) sarà implementata nel prossimo step.</p>
      
      {profile && (
        <div className="bg-muted p-4 rounded-lg space-y-2 text-sm max-w-md">
          <p className="font-semibold">Profilo Corrente:</p>
          <p>Nome: {profile.full_name}</p>
          <p>Ruolo: {profile.role}</p>
          <p>Stato: {profile.is_active ? 'Attivo' : 'Non attivo'}</p>
        </div>
      )}
    </div>
  )
}
