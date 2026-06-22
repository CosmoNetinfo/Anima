'use client'

import React, { useEffect, useState } from 'react'
import { getCurrentUserPatient } from '@/app/actions/patients'
import { addMoodEntry } from '@/app/actions/mood'
import { getMedications } from '@/app/actions/medications'
import { useUser } from '@/lib/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Smile, Heart, Pill } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Patient, MoodType, Medication } from '@/types'

const MOODS: { type: MoodType; label: string; emoji: string; text: string; bg: string }[] = [
  { type: 'felice', label: 'Felice', emoji: '😊', text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { type: 'normale', label: 'Bene', emoji: '😐', text: 'text-blue-500', bg: 'bg-blue-500/10' },
  { type: 'triste', label: 'Triste', emoji: '😢', text: 'text-amber-500', bg: 'bg-amber-500/10' },
  { type: 'agitato', label: 'Agitato', emoji: '😠', text: 'text-rose-500', bg: 'bg-rose-500/10' },
  { type: 'confuso', label: 'Confuso', emoji: '😕', text: 'text-purple-500', bg: 'bg-purple-500/10' }
]

export function DashboardPatient() {
  const { profile } = useUser()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [todayMeds, setTodayMeds] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const res = await getCurrentUserPatient()
    if (res.data) {
      setPatient(res.data)
      // Carica i farmaci attivi
      const meds = await getMedications(res.data.id, true)
      if (meds.data) {
        setTodayMeds(meds.data)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const handleQuickMood = async (mood: MoodType) => {
    if (!patient) return
    const res = await addMoodEntry({
      patient_id: patient.id,
      mood
    })
    if (res.error) {
      toast.error('Errore nel salvataggio: ' + res.error)
    } else {
      toast.success('Umore registrato!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 text-warm-foreground max-w-4xl mx-auto">
      {/* Saluto Grande */}
      <div className="bg-gradient-to-r from-primary to-amber-500 p-6 md:p-8 rounded-3xl shadow-md text-white space-y-2">
        <h2 className="text-3xl md:text-4xl font-black">Ciao, {profile?.full_name}!</h2>
        <p className="text-base md:text-lg opacity-90 font-medium">Benvenuto su Anima. Oggi è una bellissima giornata per prendersi cura di sé.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Come ti senti */}
        <Card className="border border-border shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4 border-b border-border text-center">
            <CardTitle className="text-lg font-bold flex items-center justify-center gap-2">
              <Smile className="h-5 w-5 text-primary" /> Come ti senti adesso?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleQuickMood(item.type)}
                  className="flex flex-col items-center justify-center py-4 bg-muted/40 hover:bg-primary/5 rounded-2xl transition-all active:scale-95 border border-transparent hover:border-primary/20 cursor-pointer"
                >
                  <span className="text-4xl select-none">{item.emoji}</span>
                  <span className="text-[10px] font-bold text-muted-foreground mt-1">{item.label}</span>
                </button>
              ))}
            </div>
            <Link href="/mood" className="block">
              <Button variant="outline" className="w-full rounded-xl text-xs font-bold h-10">Vedi storico benessere</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Le mie Terapie */}
        <Card className="border border-border shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4 border-b border-border text-center">
            <CardTitle className="text-lg font-bold flex items-center justify-center gap-2">
              <Pill className="h-5 w-5 text-primary" /> Le mie Terapie
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-between h-56">
            <div className="overflow-y-auto space-y-2 max-h-32 pr-1">
              {todayMeds.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nessuna terapia programmata.</p>
              ) : (
                todayMeds.map((med) => (
                  <div key={med.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                    <span className="font-bold">{med.name}</span>
                    <Badge variant="secondary" className="text-[9px]">{med.dosage}</Badge>
                  </div>
                ))
              )}
            </div>
            {patient && (
              <Link href={`/patients/${patient.id}/medications`} className="block">
                <Button className="w-full rounded-xl text-xs font-bold h-10">Visualizza orari farmaci</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* I miei Ricordi */}
      <Card className="border border-border shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4 border-b border-border text-center">
          <CardTitle className="text-lg font-bold flex items-center justify-center gap-2">
            <Heart className="h-5 w-5 text-danger fill-danger" /> Bacheca dei Ricordi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-xs text-muted-foreground">Guarda le foto e ascolta i messaggi vocali condivisi dalla tua famiglia.</p>
          <Link href="/memoriae" className="block">
            <Button size="lg" className="px-8 rounded-xl font-bold">Apri Bacheca</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
