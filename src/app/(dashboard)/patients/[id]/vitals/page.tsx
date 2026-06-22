'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { usePatient } from '@/lib/hooks/usePatient'
import { PatientHeader } from '@/components/patients/PatientHeader'
import { PatientTabSwitcher } from '@/components/patients/PatientTabSwitcher'
import { getVitalSigns, addVitalSign } from '@/app/actions/vitals'
import { VitalSign, VitalType } from '@/types'
import { useUser } from '@/lib/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Activity, Plus, Heart, Thermometer, Wind, Percent, Scale, TrendingUp, AlertTriangle } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

const VITAL_INFO: Record<VitalType, { label: string; unit: string; icon: React.ComponentType<{ className?: string }>; color: string; defaultMin: number; defaultMax: number }> = {
  blood_pressure_sys: { label: 'Pressione Sistolica', unit: 'mmHg', icon: Activity, color: '#f43f5e', defaultMin: 90, defaultMax: 140 },
  blood_pressure_dia: { label: 'Pressione Diastolica', unit: 'mmHg', icon: Activity, color: '#ec4899', defaultMin: 60, defaultMax: 90 },
  heart_rate: { label: 'Frequenza Cardiaca', unit: 'bpm', icon: Heart, color: '#e11d48', defaultMin: 50, defaultMax: 100 },
  temperature: { label: 'Temperatura', unit: '°C', icon: Thermometer, color: '#f59e0b', defaultMin: 35.5, defaultMax: 37.5 },
  oxygen_saturation: { label: 'Saturazione Ossigeno', unit: '%', icon: Wind, color: '#06b6d4', defaultMin: 92, defaultMax: 100 },
  blood_glucose: { label: 'Glicemia', unit: 'mg/dL', icon: Activity, color: '#10b981', defaultMin: 70, defaultMax: 140 },
  weight: { label: 'Peso', unit: 'kg', icon: Scale, color: '#6366f1', defaultMin: 40, defaultMax: 150 },
  height: { label: 'Altezza', unit: 'cm', icon: Scale, color: '#8b5cf6', defaultMin: 100, defaultMax: 220 },
  respiratory_rate: { label: 'Freq. Respiratoria', unit: 'atti/min', icon: Wind, color: '#3b82f6', defaultMin: 12, defaultMax: 22 }
}

export default function PatientVitalsPage() {
  const { id } = useParams()
  const { currentPatient, loading: patientLoading } = usePatient(id as string)
  const { isStaff } = useUser()

  const [vitals, setVitals] = useState<VitalSign[]>([])
  const [selectedType, setSelectedType] = useState<VitalType>('blood_pressure_sys')
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30')
  const [loading, setLoading] = useState(true)

  // Form state
  const [formType, setFormType] = useState<VitalType>('heart_rate')
  const [formValue, setFormValue] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const fetchVitals = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const res = await getVitalSigns(id as string, undefined, parseInt(timeRange))
    if (res.data) setVitals(res.data)
    setLoading(false)
  }, [id, timeRange])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVitals()
    }, 0)
    return () => clearTimeout(timer)
  }, [id, timeRange, fetchVitals])

  // Calcola gli ultimi valori per ogni tipo
  const latestVitals = useMemo(() => {
    const latestMap: Partial<Record<VitalType, VitalSign>> = {}
    vitals.forEach(v => {
      const existing = latestMap[v.type]
      if (!existing || new Date(v.recorded_at) > new Date(existing.recorded_at)) {
        latestMap[v.type] = v
      }
    })
    return latestMap
  }, [vitals])

  // Filtra i dati per il grafico del tipo selezionato
  const chartData = useMemo(() => {
    return vitals
      .filter(v => v.type === selectedType)
      .map(v => ({
        date: new Date(v.recorded_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        valore: Number(v.value),
        notes: v.notes
      }))
  }, [vitals, selectedType])

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formValue || isNaN(Number(formValue))) {
      toast.error('Inserisci un valore numerico valido')
      return
    }

    setIsSubmitting(true)
    const res = await addVitalSign({
      patient_id: id as string,
      type: formType,
      value: Number(formValue),
      notes: formNotes || undefined
    })

    setIsSubmitting(false)
    if (res.error) {
      toast.error(`Errore nel salvataggio: ${res.error}`)
    } else {
      toast.success(res.data?.is_alert ? 'Parametro salvato. Rilevato ALERT!' : 'Parametro salvato con successo')
      setFormValue('')
      setFormNotes('')
      setIsOpen(false)
      fetchVitals()
    }
  }

  if (patientLoading || !currentPatient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PatientHeader patient={currentPatient} />
      <PatientTabSwitcher patientId={currentPatient.id} />

      {/* Riquadri Ultimi Parametri Rilevati */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {Object.entries(VITAL_INFO).map(([key, info]) => {
          const type = key as VitalType
          const latest = latestVitals[type]
          const isAlert = latest?.is_alert
          const Icon = info.icon

          return (
            <Card
              key={type}
              onClick={() => setSelectedType(type)}
              className={`border transition-all cursor-pointer select-none shadow-sm hover:scale-[1.01] ${
                selectedType === type ? 'ring-2 ring-primary bg-primary/5' : 'bg-card'
              } ${isAlert ? 'border-danger/40 bg-danger/5 animate-pulse' : 'border-border'}`}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-semibold block">{info.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-foreground">
                      {latest ? Number(latest.value) : '--'}
                    </span>
                    <span className="text-xs text-muted-foreground">{info.unit}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block">
                    {latest ? new Date(latest.recorded_at).toLocaleDateString('it-IT') : 'Nessuna rilevazione'}
                  </span>
                </div>
                <div className={`p-2 rounded-lg ${isAlert ? 'bg-danger/20 text-danger' : 'bg-muted'}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Sezione Grafico e Form di Inserimento */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Grafico con Recharts */}
        <Card className="flex-1 border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-bold">Trend: {VITAL_INFO[selectedType].label}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={(val) => setTimeRange(val as '7' | '30' | '90')}>
                <SelectTrigger className="w-28 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Giorni</SelectItem>
                  <SelectItem value="30">30 Giorni</SelectItem>
                  <SelectItem value="90">3 Mesi</SelectItem>
                </SelectContent>
              </Select>
              {isStaff() && (
                <Button size="sm" onClick={() => setIsOpen(true)} className="h-9 gap-1">
                  <Plus className="h-4 w-4" /> Aggiungi
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground text-sm">
                Nessun dato registrato nel periodo selezionato.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: '8px' }} />
                    <Line
                      type="monotone"
                      dataKey="valore"
                      stroke={VITAL_INFO[selectedType].color}
                      strokeWidth={3}
                      activeDot={{ r: 6 }}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modale Inserimento Parametro (Solo Staff) */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registra Parametro Vitale</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="vital-type">Tipo di Rilevazione</Label>
              <select
                id="vital-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formType}
                onChange={(e) => setFormType(e.target.value as VitalType)}
              >
                {Object.entries(VITAL_INFO).map(([key, value]) => (
                  <option key={key} value={key}>{value.label} ({value.unit})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vital-val">Valore ({VITAL_INFO[formType]?.unit})</Label>
              <Input
                id="vital-val"
                type="number"
                step="0.01"
                placeholder={`Es: ${VITAL_INFO[formType]?.defaultMin}`}
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vital-notes">Note Aggiuntive / Contesto (Opzionale)</Label>
              <Input
                id="vital-notes"
                placeholder="Es: A riposo da 10 minuti"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annulla</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvataggio...' : 'Registra Parametro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
