'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

interface PatientSearchProps {
  search: string
  onSearchChange: (value: string) => void
  ward: string
  onWardChange: (value: string) => void
  showInactive: boolean
  onShowInactiveChange: (value: boolean) => void
}

export function PatientSearch({
  search,
  onSearchChange,
  ward,
  onWardChange,
  showInactive,
  onShowInactiveChange,
}: PatientSearchProps) {
  // Esempio reparti per RSA/Struttura
  const wards = [
    { value: 'all', label: 'Tutti i reparti' },
    { value: 'Alzheimer', label: 'Reparto Alzheimer' },
    { value: 'Geriatria', label: 'Geriatria' },
    { value: 'Fisioterapia', label: 'Fisioterapia' },
  ]

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
      {/* Ricerca Testuale */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cerca paziente per nome..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 w-full"
        />
      </div>

      {/* Filtri extra */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Selezione Reparto */}
        <Select value={ward} onValueChange={(val) => onWardChange(val ?? 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleziona reparto" />
          </SelectTrigger>
          <SelectContent>
            {wards.map((w) => (
              <SelectItem key={w.value} value={w.value}>
                {w.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Toggle Mostra Inattivi */}
        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => onShowInactiveChange(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
          />
          <span className="text-muted-foreground">Mostra non attivi</span>
        </label>
      </div>
    </div>
  )
}
