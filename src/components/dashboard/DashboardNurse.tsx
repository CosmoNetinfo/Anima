'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Activity, Bell, MessageSquare, Clipboard } from 'lucide-react'

export function DashboardNurse() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Pannello Infermieristico (CareLink)</h2>
        <p className="text-muted-foreground text-sm">
          Gestione dei farmaci, dei parametri vitali e del diario clinico dei pazienti della struttura.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Pazienti in Reparto" value="14" icon={<Clipboard className="text-clinical" />} />
        <KpiCard title="Farmaci da Somministrare" value="28" icon={<Activity className="text-primary" />} description="12 rimasti per il turno corrente" />
        <KpiCard title="Alert Parametri" value="2 attivi" icon={<Bell className="text-danger" />} trend={{ value: 'Urgente', direction: 'down' }} />
        <KpiCard title="Messaggi Famiglie" value="5" icon={<MessageSquare className="text-success" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Prossime Somministrazioni Farmaci</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Tutte le somministrazioni per il turno attuale sono completate.</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-danger">Pazienti da Monitorare (Fuori Soglia)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Nessun alert critico attivo al momento.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
