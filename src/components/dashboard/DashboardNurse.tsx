'use client'

import React, { useEffect, useState } from 'react'
import { getPatients } from '@/app/actions/patients'
import { getVitalSigns } from '@/app/actions/vitals'
import { Patient, VitalSign } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, User, ShieldAlert, Pill, Activity, Check } from 'lucide-react'
import Link from 'next/link'

export function DashboardNurse() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [alerts, setAlerts] = useState<VitalSign[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const ptsRes = await getPatients()
    if (ptsRes.data) {
      setPatients(ptsRes.data)
      
      // Carica misurazioni e filtra quelle in alert degli ultimi 3 giorni
      const allAlerts: VitalSign[] = []
      await Promise.all(
        ptsRes.data.map(async (p) => {
          const vitRes = await getVitalSigns(p.id, undefined, 3)
          if (vitRes.data) {
            const alertsOnly = vitRes.data.filter(v => v.is_alert)
            allAlerts.push(...alertsOnly)
          }
        })
      )
      setAlerts(allAlerts)
    }
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Saluto Nurse */}
      <div>
        <h2 className="text-2xl font-black text-foreground">Dashboard Infermieristica</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Monitora i parametri vitali dei pazienti in tempo reale e compila le somministrazioni.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI Panel */}
        <Card className="border border-border shadow-sm bg-primary/5">
          <CardContent className="p-6 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pazienti Totali</span>
            <div className="text-3xl font-black text-primary">{patients.length}</div>
            <p className="text-[11px] text-muted-foreground">Ospiti attivi registrati in struttura.</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm bg-rose-500/5">
          <CardContent className="p-6 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alert Rilevati (72h)</span>
            <div className="text-3xl font-black text-danger">{alerts.length}</div>
            <p className="text-[11px] text-muted-foreground">Misurazioni fuori dalle soglie di sicurezza.</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardContent className="p-6 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stato Consegne</span>
            <div className="text-3xl font-black text-foreground">Attivo</div>
            <p className="text-[11px] text-muted-foreground">Turno infermieristico in corso.</p>
          </CardContent>
        </Card>
      </div>

      {/* Pazienti in Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-border bg-muted/20">
            <ShieldAlert className="h-5 w-5 text-danger" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Alert Parametri Vitali Recenti</CardTitle>
          </CardHeader>
          <CardContent className="p-6 divide-y divide-border">
            {alerts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Nessun parametro fuori soglia rilevato recentemente.</p>
            ) : (
              alerts.slice(0, 5).map((alert) => {
                const pt = patients.find(p => p.id === alert.patient_id)
                return (
                  <div key={alert.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div>
                      <strong className="text-sm text-foreground block">{pt?.full_name || 'Ospite'}</strong>
                      <span className="text-[11px] text-muted-foreground block capitalize">
                        Parametro: {alert.type.replace(/_/g, ' ')} • Valore: <strong className="text-danger">{alert.value} {alert.unit}</strong>
                      </span>
                    </div>
                    {pt && (
                      <Link href={`/patients/${pt.id}/vitals`}>
                        <Button size="xs" variant="outline">Gestisci</Button>
                      </Link>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Lista Pazienti Rapida */}
        <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-border bg-muted/20">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Accesso Rapido Fascicoli</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3 max-h-80 overflow-y-auto">
            {patients.slice(0, 6).map((pt) => (
              <div key={pt.id} className="flex justify-between items-center py-1">
                <div>
                  <span className="text-xs font-bold text-foreground block">{pt.full_name}</span>
                  <span className="text-[10px] text-muted-foreground">Stanza: {pt.room_number || '--'}</span>
                </div>
                <Link href={`/patients/${pt.id}/overview`}>
                  <Button size="xs" variant="ghost" className="text-primary hover:bg-primary/5">Fascicolo</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
