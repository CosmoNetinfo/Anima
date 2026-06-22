'use client'

import React, { useEffect, useState } from 'react'
import { getPatients } from '@/app/actions/patients'
import { createClient } from '@/lib/supabase/client'
import { Patient } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/ui/KpiCard'
import { Users, FileText, Settings, ShieldAlert, Award } from 'lucide-react'
import Link from 'next/link'

export function DashboardAdmin() {
  const [patientCount, setPatientCount] = useState(0)
  const [profileCount, setProfileCount] = useState(0)
  const [logsCount, setLogsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const [ptsRes, profsRes, logsRes] = await Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('audit_log').select('id', { count: 'exact', head: true })
    ])

    if (ptsRes.count !== null) setPatientCount(ptsRes.count)
    if (profsRes.count !== null) setProfileCount(profsRes.count)
    if (logsRes.count !== null) setLogsCount(logsRes.count)
    
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStats()
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
        <h2 className="text-2xl font-black text-foreground">Console Amministratore</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Gestione utenti, audit log di sicurezza e configurazione dei parametri di struttura.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KpiCard
          title="Ospiti Registrati"
          value={patientCount.toString()}
          description="Pazienti attivi nella struttura"
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          title="Profili Utente"
          value={profileCount.toString()}
          description="Infermieri, medici, caregiver, admin"
          icon={<Award className="h-5 w-5" />}
          trend={{ value: 'Attivi', direction: 'neutral' }}
        />
        <KpiCard
          title="Log Sicurezza"
          value={logsCount.toString()}
          description="Azioni tracciate nel registro immutabile"
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      {/* Riquadri Strumenti e Navigazione Rapida */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-border shadow-sm rounded-2xl overflow-hidden bg-card hover:bg-muted/10 transition-colors">
          <CardHeader className="flex flex-row items-center gap-3 pb-3 border-b border-border bg-muted/20">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-bold">Gestione Struttura & Utenti</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-xs text-muted-foreground">
              Invita nuovi infermieri o medici ad accedere alla piattaforma, gestisci i loro ruoli o disattiva gli utenti che non fanno più parte del personale.
            </p>
            <div className="flex gap-2.5">
              <Link href="/admin">
                <Button size="sm" className="font-bold">Console Utenti</Button>
              </Link>
              <Link href="/settings">
                <Button size="sm" variant="outline" className="font-bold">Soglie Vitali</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm rounded-2xl overflow-hidden bg-card hover:bg-muted/10 transition-colors">
          <CardHeader className="flex flex-row items-center gap-3 pb-3 border-b border-border bg-muted/20">
            <ShieldAlert className="h-5 w-5 text-danger" />
            <CardTitle className="text-base font-bold">Audit Log Sicurezza</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-xs text-muted-foreground">
              Visualizza il registro immutabile delle attività della struttura. Traccia accessi, modifiche terapeutiche, e aggiornamenti delle cartelle cliniche in conformità GDPR.
            </p>
            <Link href="/admin?tab=audit">
              <Button size="sm" variant="destructive" className="font-bold">Esamina Log</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
