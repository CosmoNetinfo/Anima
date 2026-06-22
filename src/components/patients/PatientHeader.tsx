'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Patient } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/StatusDot'
import { Button } from '@/components/ui/button'
import { FileText, MessageSquare, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

interface PatientHeaderProps {
  patient: Patient
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  const router = useRouter()
  const initials = patient.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const birthDate = new Date(patient.birth_date)
  const age = new Date().getFullYear() - birthDate.getFullYear()

  // Determina lo stato clinico
  const alertStatus = patient.allergies && patient.allergies.length > 0 ? 'alert' : 'ok'

  const handleExportPDF = () => {
    toast.success('Generazione file PDF in corso...')
    window.open(`/api/export?patientId=${patient.id}`, '_blank')
  }

  const handleSendMessage = () => {
    toast.success('Avvio chat con la famiglia...')
    router.push('/messages')
  }

  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-6">
      {/* Profilo ed Anagrafica */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-border shadow-sm">
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{patient.full_name}</h2>
            <StatusDot status={alertStatus} />
            {!patient.is_active && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Inattivo
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {age} anni ({patient.gender}) • Nato il {new Date(patient.birth_date).toLocaleDateString('it-IT')}
          </p>
          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            {patient.ward && (
              <span>
                Reparto: <strong className="text-foreground font-semibold">{patient.ward}</strong>
              </span>
            )}
            {patient.room_number && (
              <span>
                Stanza: <strong className="text-foreground font-semibold">{patient.room_number}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Badge Allergie e Patologie */}
      <div className="flex flex-col gap-2 max-w-sm md:items-end">
        {/* Patologie Croniche */}
        {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap justify-start md:justify-end">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Patologie:</span>
            {patient.chronic_conditions.map((c, i) => (
              <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5 bg-primary-light/30 border-primary/20 text-primary">
                {c}
              </Badge>
            ))}
          </div>
        )}

        {/* Allergie */}
        {patient.allergies && patient.allergies.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap justify-start md:justify-end">
            <span className="text-[10px] uppercase font-bold text-danger tracking-wider flex items-center gap-0.5">
              <ShieldAlert className="h-3 w-3" /> Allergie:
            </span>
            {patient.allergies.map((a, i) => (
              <Badge key={i} variant="destructive" className="text-[10px] py-0 px-1.5">
                {a}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Azioni Rapide */}
      <div className="flex items-center gap-3 w-full md:w-auto shrink-0 border-t border-border pt-4 md:border-t-0 md:pt-0">
        <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex-1 md:flex-none gap-1.5">
          <FileText className="h-4 w-4" /> Export PDF
        </Button>
        <Button size="sm" onClick={handleSendMessage} className="flex-1 md:flex-none gap-1.5">
          <MessageSquare className="h-4 w-4" /> Messaggio famiglia
        </Button>
      </div>
    </div>
  )
}
