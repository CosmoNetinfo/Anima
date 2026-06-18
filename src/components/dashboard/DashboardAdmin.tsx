'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '@/components/ui/KpiCard'
import { ShieldCheck, Users, Activity, FileKey } from 'lucide-react'

export function DashboardAdmin() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Pannello Amministrativo (CareLink)</h2>
        <p className="text-muted-foreground text-sm">
          Gestione dei profili utente, ruoli, impostazioni di struttura ed auditing di sicurezza.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Utenti Registrati" value="34" icon={<Users className="text-clinical" />} />
        <KpiCard title="Struttura Attiva" value="RSA Milano" icon={<ShieldCheck className="text-primary" />} />
        <KpiCard title="Accessi Odierni" value="18" icon={<Activity className="text-success" />} />
        <KpiCard title="Audit Logs Generati" value="156" icon={<FileKey className="text-danger" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ultimi Inviti ed Accessi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Tutti gli utenti registrati sono attivi nel database.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Log Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Nessuna violazione o anomalia registrata nei log di audit.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
