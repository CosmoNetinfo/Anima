'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Smile, Heart, Activity, Calendar, MessageSquare } from 'lucide-react'

export function DashboardCaregiver() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Pannello Caregiver</h2>
        <p className="text-muted-foreground text-sm">
          Monitora lo stato di salute e le attività quotidiane del tuo familiare assistito.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Umore Paziente" value="Felice" icon={<Smile className="text-warm" />} description="Ultimo aggiornamento: oggi 10:00" />
        <KpiCard title="Terapia del Giorno" value="3 / 4" icon={<Activity className="text-clinical" />} description="Prossima somministrazione alle 14:00" />
        <KpiCard title="Messaggi Struttura" value="2 nuovi" icon={<MessageSquare className="text-primary" />} description="Ultimo messaggio da Infermiera Rossi" />
        <KpiCard title="Ricordi Condivisi" value="12" icon={<Heart className="text-danger" />} description="1 nuovo caricato oggi" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Diario Clinico Recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Nessuna nota clinica inserita oggi dallo staff.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appuntamenti in Agenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Prossima visita medica programmata il 22/06 ore 15:30.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
