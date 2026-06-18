'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Heart, Activity, UserPlus, FileText } from 'lucide-react'

export function DashboardDoctor() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Pannello Medico (CareLink)</h2>
        <p className="text-muted-foreground text-sm">
          Fascicolo clinico, storico parametri vitali, prescrizioni farmacologiche e diario clinico.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Pazienti in Carico" value="8" icon={<UserPlus className="text-clinical" />} />
        <KpiCard title="Note Mediche Oggi" value="4" icon={<FileText className="text-primary" />} />
        <KpiCard title="Parametri Monitorati" value="96" icon={<Activity className="text-success" />} />
        <KpiCard title="Stato Medio Umore" value="Stabile" icon={<Heart className="text-danger" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pazienti con Parametri Fuori Soglia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Tutti i parametri vitali rientrano nei range previsti.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultime Note Cliniche Private</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Nessuna nota medica privata inserita recentemente.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
