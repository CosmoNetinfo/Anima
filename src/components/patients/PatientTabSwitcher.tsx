'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { cn } from '@/lib/utils'
import {
  FileText,
  Activity,
  Calendar,
  Heart,
  Pill,
  ClipboardList
} from 'lucide-react'

interface PatientTabSwitcherProps {
  patientId: string
}

export function PatientTabSwitcher({ patientId }: PatientTabSwitcherProps) {
  const pathname = usePathname()
  const { isStaff, isAdmin } = useUser()

  const tabs = [
    {
      href: `/patients/${patientId}/overview`,
      label: 'Panoramica',
      icon: ClipboardList,
      show: true,
    },
    {
      href: `/patients/${patientId}/medications`,
      label: 'Terapia',
      icon: Pill,
      show: true, // Tutti vedono i farmaci del proprio paziente, l'infermiere somministra
    },
    {
      href: `/patients/${patientId}/vitals`,
      label: 'Parametri Vitali',
      icon: Activity,
      show: true,
    },
    {
      href: `/patients/${patientId}/diary`,
      label: 'Diario Clinico',
      icon: FileText,
      show: true, // Note cliniche (filtro per caregiver)
    },
    {
      href: `/patients/${patientId}/appointments`,
      label: 'Appuntamenti',
      icon: Calendar,
      show: true,
    },
    {
      href: `/patients/${patientId}/memories`,
      label: 'Memoriae',
      icon: Heart,
      show: true, // Ricordi condivisi
    },
  ]

  return (
    <div className="flex border-b border-border overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex space-x-1.5 min-w-max pb-1">
        {tabs
          .filter((t) => t.show)
          .map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 border-transparent select-none whitespace-nowrap',
                  isActive
                    ? 'border-primary text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <tab.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                {tab.label}
              </Link>
            )
          })}
      </div>
    </div>
  )
}
