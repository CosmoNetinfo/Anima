'use client'

import React, { useEffect, useState } from 'react'
import { getCurrentUserPatient } from '@/app/actions/patients'
import { getVitalSigns } from '@/app/actions/vitals'
import { getMedications } from '@/app/actions/medications'
import { Patient, VitalSign, Medication } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, Activity, Pill, MessageSquare, Calendar, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export function DashboardCaregiver() {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [vitals, setVitals] = useState<VitalSign[]>([])
  const [meds, setMeds] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const res = await getCurrentUserPatient()
    if (res.data) {
      setPatient(res.data)
      const [vitsRes, medsRes] = await Promise.all([
        getVitalSigns(res.data.id, undefined, 7),
        getMedications(res.data.id, true)
      ])
      if (vitsRes.data) setVitals(vitsRes.data)
      if (medsRes.data) setMeds(medsRes.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Trova gli ultimi parametri vitali per ciascun tipo
  const latestVitals = React.useMemo(() => {
    const latestMap: Partial<Record<string, VitalSign>> = {}
    vitals.forEach(v => {
      const existing = latestMap[v.type]
      if (!existing || new Date(v.recorded_at) > new Date(existing.recorded_at)) {
        latestMap[v.type] = v
      }
    })
    return Object.values(latestMap).filter((v): v is VitalSign => !!v)
  }, [vitals])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-10 bg-card rounded-2xl border border-border">
        <p className="text-muted-foreground text-sm font-semibold">Nessun paziente associato a questo caregiver.</p>
        <p className="text-xs text-muted-foreground mt-1">{"Richiedi l'associazione al personale clinico della struttura."}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Intestazione Paziente Monitorato */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Paziente Monitorato</span>
          <h2 className="text-2xl font-black text-foreground mt-1">{patient.full_name}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Reparto: <strong>{patient.ward || 'N/A'}</strong> • Stanza: <strong>{patient.room_number || 'N/A'}</strong>
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href={`/patients/${patient.id}/overview`} className="flex-1 sm:flex-initial">
            <Button className="w-full">Cartella Clinica</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ultimi Parametri Vitali */}
        <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-border bg-muted/20">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Parametri Vitali</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {latestVitals.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Nessuna misurazione recente.</p>
            ) : (
              latestVitals.map(v => (
                <div key={v.id} className={`flex items-center justify-between p-3 rounded-xl border ${v.is_alert ? 'border-danger/30 bg-danger/5 text-danger animate-pulse' : 'border-border bg-muted/20'}`}>
                  <div className="text-xs font-bold capitalize">
                    {v.type.replace(/_/g, ' ')}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold">{v.value} {v.unit}</span>
                    {v.is_alert && <ShieldAlert className="h-4 w-4 text-danger shrink-0" />}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Terapie Attive */}
        <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-border bg-muted/20">
            <Pill className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Terapie Attive</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {meds.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Nessun farmaco attivo.</p>
            ) : (
              meds.map(m => (
                <div key={m.id} className="flex justify-between items-center text-xs py-2 border-b border-border/50 last:border-0">
                  <div>
                    <span className="font-bold text-foreground block">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground">Via: {m.route} • Orari: {m.schedule.times.join(', ')}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{m.dosage}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scorciatoie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/memoriae" className="block">
          <Card className="border border-border shadow-sm hover:bg-muted/30 transition-colors cursor-pointer rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-danger/10 text-danger rounded-xl">
                <Heart className="h-6 w-6 fill-danger text-danger" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Bacheca dei Ricordi</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Condividi foto e messaggi con il tuo caro.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/messages" className="block">
          <Card className="border border-border shadow-sm hover:bg-muted/30 transition-colors cursor-pointer rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Contatta lo Staff</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Invia un messaggio o un vocale al reparto clinico.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
