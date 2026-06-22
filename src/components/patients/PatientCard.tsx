'use client'

import React from 'react'
import Link from 'next/link'
import { Patient } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/StatusDot'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowRight, DoorOpen, BedDouble } from 'lucide-react'

interface PatientCardProps {
  patient: Patient
  onEdit?: (patient: Patient) => void
  canEdit?: boolean
}

export function PatientCard({ patient, onEdit, canEdit = false }: PatientCardProps) {
  const initials = patient.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Calcola l'età del paziente
  const birthDate = new Date(patient.birth_date)
  const age = new Date().getFullYear() - birthDate.getFullYear()

  // Determina lo stato di alert clinico in base alla presenza di allergie o patologie croniche importanti
  const alertStatus = patient.allergies && patient.allergies.length > 0 ? 'alert' : 'ok'

  return (
    <>
      {/* Vista Mobile (<768px): Card Completa */}
      <div className="block md:hidden">
        <Link href={`/patients/${patient.id}/overview`}>
          <Card className="border border-border hover:border-primary/50 transition-all shadow-sm active:scale-[0.99]">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{patient.full_name}</span>
                    <StatusDot status={alertStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {age} anni ({patient.gender})
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {patient.room_number && (
                      <span className="flex items-center gap-1">
                        <DoorOpen className="h-3 w-3" /> St. {patient.room_number}
                      </span>
                    )}
                    {patient.ward && (
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-3 w-3" /> Rep. {patient.ward}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Vista Desktop (>=768px): Riga di tabella */}
      <tr className="hidden md:table-row hover:bg-muted/50 border-b border-border transition-colors">
        <td className="py-4 px-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="font-semibold text-sm block text-foreground">{patient.full_name}</span>
              <span className="text-xs text-muted-foreground">{patient.fiscal_code || 'N/A'}</span>
            </div>
          </div>
        </td>
        <td className="py-4 px-6 text-sm text-muted-foreground">
          {age} anni ({patient.gender})
        </td>
        <td className="py-4 px-6 text-sm text-muted-foreground">
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{patient.ward || 'N/A'}</span>
            <span className="text-xs">Stanza {patient.room_number || 'N/A'}</span>
          </div>
        </td>
        <td className="py-4 px-6 text-sm">
          <div className="flex items-center gap-2">
            <StatusDot status={alertStatus} />
            <span className="text-muted-foreground text-xs">
              {patient.allergies && patient.allergies.length > 0
                ? `${patient.allergies.length} allergie`
                : 'Nessuna allergia'}
            </span>
          </div>
        </td>
        <td className="py-4 px-6 text-right space-x-2">
          {canEdit && onEdit && (
            <button
              onClick={() => onEdit(patient)}
              className="text-xs font-semibold text-primary hover:underline px-2 py-1 rounded"
            >
              Modifica
            </button>
          )}
          <Link
            href={`/patients/${patient.id}/overview`}
            className="inline-flex items-center justify-center text-xs font-semibold bg-primary text-white rounded-lg px-3 py-1.5 hover:bg-primary/95 transition-all"
          >
            Fascicolo
          </Link>
        </td>
      </tr>
    </>
  )
}
