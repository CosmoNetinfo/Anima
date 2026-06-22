'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { getCurrentUserPatient, getPatients } from '@/app/actions/patients'
import { getMoodEntries, addMoodEntry } from '@/app/actions/mood'
import { MoodEntry, MoodType, Patient } from '@/types'
import { useUser } from '@/lib/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Smile, Meh, Frown, AlertCircle, HelpCircle, Activity, Heart } from 'lucide-react'

const MOODS: Record<MoodType, { type: MoodType; label: string; emoji: string; color: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  felice: { type: 'felice', label: 'Felice', emoji: '😊', color: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: Smile },
  normale: { type: 'normale', label: 'Bene', emoji: '😐', color: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-500', icon: Meh },
  triste: { type: 'triste', label: 'Triste', emoji: '😢', color: '#f59e0b', bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Frown },
  agitato: { type: 'agitato', label: 'Agitato', emoji: '😠', color: '#ef4444', bg: 'bg-rose-500/10', text: 'text-rose-500', icon: AlertCircle },
  confuso: { type: 'confuso', label: 'Confuso', emoji: '😕', color: '#8b5cf6', bg: 'bg-purple-500/10', text: 'text-purple-500', icon: HelpCircle }
}

const MOOD_VALUES: Record<MoodType, number> = {
  triste: 1,
  agitato: 2,
  confuso: 3,
  normale: 4,
  felice: 5
}

export default function MoodPage() {
  const { profile, isPatient, isStaff, isCaregiver } = useUser()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [patientsList, setPatientsList] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Inserimento mood
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const profileRole = profile?.role

  // Caricamento dati iniziali
  const init = useCallback(async () => {
    setLoading(true)
    try {
      const patientRoles = ['patient']
      const caregiverRoles = ['caregiver']
      const staffRoles = ['admin', 'super_admin', 'doctor', 'nurse']

      if (profileRole && patientRoles.includes(profileRole)) {
        const res = await getCurrentUserPatient()
        if (res.data) {
          setPatient(res.data)
          setSelectedPatientId(res.data.id)
          const hist = await getMoodEntries(res.data.id)
          if (hist.data) setMoodHistory(hist.data)
        }
      } else if (profileRole && caregiverRoles.includes(profileRole)) {
        // Il caregiver vede il paziente collegato
        const res = await getCurrentUserPatient()
        if (res.data) {
          setPatient(res.data)
          setSelectedPatientId(res.data.id)
          const hist = await getMoodEntries(res.data.id)
          if (hist.data) setMoodHistory(hist.data)
        }
      } else if (profileRole && staffRoles.includes(profileRole)) {
        const resList = await getPatients()
        if (resList.data && resList.data.length > 0) {
          setPatientsList(resList.data)
          const p = resList.data[0]
          setPatient(p)
          setSelectedPatientId(p.id)
          const hist = await getMoodEntries(p.id)
          if (hist.data) setMoodHistory(hist.data)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [profileRole])

  useEffect(() => {
    if (profile) {
      const timer = setTimeout(() => {
        init()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [profile?.id, profileRole, init])


  const handlePatientChange = async (pId: string | null) => {
    if (!pId) return
    setSelectedPatientId(pId)
    const p = patientsList.find(x => x.id === pId) || null
    setPatient(p)
    setLoading(true)
    const hist = await getMoodEntries(pId)
    if (hist.data) setMoodHistory(hist.data)
    setLoading(false)
  }

  const handleSubmitMood = async () => {
    if (!selectedMood) return
    if (!selectedPatientId || !patient) {
      toast.error('Nessun paziente associato a questo account. Impossibile salvare il mood.')
      return
    }
    setSaving(true)
    const res = await addMoodEntry({
      patient_id: selectedPatientId,
      mood: selectedMood,
      notes: notes || undefined
    })
    setSaving(false)
    if (res.error) {
      toast.error('Errore nel salvataggio: ' + res.error)
    } else {
      toast.success('Umore registrato con successo!')
      setSelectedMood(null)
      setNotes('')
      // Ricarica storico
      const hist = await getMoodEntries(selectedPatientId)
      if (hist.data) setMoodHistory(hist.data)
    }
  }

  // Prepara i dati del grafico
  const chartData = useMemo(() => {
    return moodHistory.map(entry => {
      const info = MOODS[entry.mood]
      return {
        date: new Date(entry.recorded_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        valore: MOOD_VALUES[entry.mood],
        label: info?.label || entry.mood,
        emoji: info?.emoji || '',
        notes: entry.notes
      }
    })
  }, [moodHistory])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Paziente senza record DB associato (es. override role da debug console)
  const isPatientWithNoRecord = isPatient() && !patient
  if (isPatientWithNoRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center max-w-md mx-auto">
        <span className="text-5xl">🔗</span>
        <h3 className="text-lg font-bold text-foreground">Nessun paziente collegato</h3>
        <p className="text-sm text-muted-foreground">
          L&apos;account attuale non ha un record paziente associato nel database.<br />
          <span className="text-yellow-500 font-semibold">Se stai usando l&apos;override debug</span>, questo comportamento è atteso — il salvataggio richiederebbe un vero account paziente.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Clinico/Admin: Selettore Paziente */}
      {isStaff() && patientsList.length > 0 && (
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-muted-foreground">Seleziona Paziente da Monitorare:</span>
            <Select value={selectedPatientId} onValueChange={handlePatientChange}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {patientsList.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sinistra: Registrazione Umore (Solo Paziente) */}
        {isPatient() && (
          <Card className="border border-border shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4 border-b border-border text-center">
              <CardTitle className="text-xl font-black text-foreground flex items-center justify-center gap-2">
                <Heart className="h-5 w-5 text-primary fill-primary animate-pulse" /> Come ti senti oggi?
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{"Seleziona l'emoji che rappresenta meglio il tuo stato d'animo."}</p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Emojis grid */}
              <div className="grid grid-cols-5 gap-2.5">
                {Object.values(MOODS).map((item) => {
                  const isSelected = selectedMood === item.type
                  return (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      key={item.type}
                      type="button"
                      onClick={() => setSelectedMood(item.type)}
                      className={`flex flex-col items-center justify-center py-4 px-2 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? `border-${item.type === 'felice' ? 'emerald' : item.type === 'normale' ? 'blue' : item.type === 'triste' ? 'amber' : item.type === 'agitato' ? 'rose' : 'purple'}-500 ring-2 ring-primary/20 ${item.bg}`
                          : 'border-border bg-card hover:bg-muted/50'
                      }`}
                    >
                      <span className="text-3xl md:text-4xl mb-1.5 select-none">{item.emoji}</span>
                      <span className={`text-[11px] font-bold ${isSelected ? item.text : 'text-muted-foreground'}`}>
                        {item.label}
                      </span>
                    </motion.button>
                  )
                })}
              </div>

              {/* Note / Diario Personale */}
              <div className="space-y-2">
                <Label htmlFor="mood-notes" className="text-xs font-semibold text-muted-foreground">Scrivi un pensiero o una nota (Opzionale)</Label>
                <Input
                  id="mood-notes"
                  placeholder="Es: Oggi c'è il sole e mi sento riposato..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              <Button
                size="lg"
                className="w-full h-11 font-bold rounded-xl"
                onClick={handleSubmitMood}
                disabled={!selectedMood || saving}
              >
                {saving ? 'Salvataggio...' : 'Registra il tuo Umore'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Destra o Layout per Clinici: Storico/Grafico dell'Umore */}
        <Card className={`border border-border shadow-sm ${!isPatient() ? 'lg:col-span-2' : ''}`}>
          <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-border">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-bold">Andamento del Benessere (30 Giorni)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-20">Nessuna misurazione registrata in questo periodo.</p>
            ) : (
              <div className="space-y-6">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tickFormatter={(v) => {
                          if (v === 5) return '😊'
                          if (v === 4) return '😐'
                          if (v === 3) return '😕'
                          if (v === 2) return '😠'
                          if (v === 1) return '😢'
                          return ''
                        }}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: '8px' }}
                        formatter={(val: unknown, name, props) => [props.payload.label, 'Stato']}
                      />
                      <Area
                        type="monotone"
                        dataKey="valore"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorMood)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Lista Storico con Note */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Note e Rilevazioni Recenti</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1.5 divide-y divide-border">
                    {moodHistory
                      .slice()
                      .reverse()
                      .map((entry) => {
                        const mInfo = MOODS[entry.mood]
                        return (
                          <div key={entry.id} className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-sm">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-base select-none">{mInfo?.emoji || '😐'}</span>
                                <span className="font-bold text-foreground capitalize">{entry.mood}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(entry.recorded_at).toLocaleDateString('it-IT', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              {entry.notes && (
                                <p className="text-xs text-muted-foreground mt-1 bg-muted/30 p-2 rounded-lg border border-border">
                                  {entry.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
