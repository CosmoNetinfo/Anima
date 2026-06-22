'use client'

import React, { useEffect, useState } from 'react'
import { getPatients } from '@/app/actions/patients'
import { getVitalSigns } from '@/app/actions/vitals'
import { Patient, VitalSign } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, ShieldAlert, Pill, FileText, ClipboardList } from 'lucide-react'
import Link from 'next/link'

export function DashboardDoctor() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [alerts, setAlerts] = useState<VitalSign[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const ptsRes = await getPatients()
    if (ptsRes.data) {
      setPatients(ptsRes.data)
      
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
      <div>
        <h2 className="text-2xl font-black text-foreground">Portale Medico Clinico</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Gestione clinica, prescrizione farmaci ed esame dei parametri vitali degli ospiti.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parametri fuori soglia */}
        <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-border bg-muted/20">
            <ShieldAlert className="h-5 w-5 text-danger" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Alert Clinici (Ultime 72 ore)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 divide-y divide-border">
            {alerts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Nessun alert clinico pendente.</p>
            ) : (
              alerts.slice(0, 6).map((alert) => {
                const pt = patients.find(p => p.id === alert.patient_id)
                return (
                  <div key={alert.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div>
                      <strong className="text-sm text-foreground block">{pt?.full_name || 'Ospite'}</strong>
                      <span className="text-[11px] text-muted-foreground block capitalize">
                        Parametro: {alert.type.replace(/_/g, ' ')} • Rilevato: <strong className="text-danger">{alert.value} {alert.unit}</strong>
                      </span>
                    </div>
                    {pt && (
                      <div className="flex gap-1.5 shrink-0">
                        <Link href={`/patients/${pt.id}/vitals`}>
                          <Button size="xs" variant="outline">Trend</Button>
                        </Link>
                        <Link href={`/patients/${pt.id}/medications`}>
                          <Button size="xs" className="gap-1 h-7">
                            <Pill className="h-3.5 w-3.5" /> Prescrivi
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Directory Pazienti Rapida */}
        <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-border bg-muted/20">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Ospiti della Struttura</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3 max-h-80 overflow-y-auto">
            {patients.map((pt) => (
              <div key={pt.id} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                <div>
                  <span className="text-xs font-bold text-foreground block">{pt.full_name}</span>
                  <span className="text-[10px] text-muted-foreground block">
                    Reparto: {pt.ward || '--'} • Stanza: {pt.room_number || '--'}
                  </span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Link href={`/patients/${pt.id}/overview`}>
                    <Button size="xs" variant="ghost" className="text-primary h-7">Cartella</Button>
                  </Link>
                  <Link href={`/patients/${pt.id}/diary`}>
                    <Button size="xs" variant="ghost" className="text-primary h-7"><FileText className="h-3 w-3" /></Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
