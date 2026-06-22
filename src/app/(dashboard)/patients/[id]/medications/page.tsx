'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { usePatient } from '@/lib/hooks/usePatient'
import { PatientHeader } from '@/components/patients/PatientHeader'
import { PatientTabSwitcher } from '@/components/patients/PatientTabSwitcher'
import { getMedications, createMedication, getMedicationLogs, logMedicationAdministration } from '@/app/actions/medications'
import { Medication, MedicationLog } from '@/types'
import { useUser } from '@/lib/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Pill, Check, X, Calendar, Plus, Clock } from 'lucide-react'
import { toast } from 'sonner'

export default function PatientMedicationsPage() {
  const { id } = useParams()
  const { currentPatient, loading: patientLoading } = usePatient(id as string)
  const { profile, isStaff } = useUser()
  const role = profile?.role

  const [medications, setMedications] = useState<Medication[]>([])
  const [logs, setLogs] = useState<MedicationLog[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  // Prescribing modal state
  const [isPrescribeOpen, setIsPrescribeOpen] = useState(false)
  const [newMedName, setNewMedName] = useState('')
  const [newMedPrinciple, setNewMedPrinciple] = useState('')
  const [newMedDosage, setNewMedDosage] = useState('')
  const [newMedRoute, setNewMedRoute] = useState('Orale')
  const [newMedTimes, setNewMedTimes] = useState('08:00')
  const [newMedStartDate, setNewMedStartDate] = useState(new Date().toISOString().split('T')[0])
  const [newMedEndDate, setNewMedEndDate] = useState('')
  const [newMedNotes, setNewMedNotes] = useState('')

  // Administration skip/refused modal state
  const [isSkipOpen, setIsSkipOpen] = useState(false)
  const [skipLogData, setSkipLogData] = useState<{ medication_id: string; scheduled_time: string; status: 'skipped' | 'refused' } | null>(null)
  const [skipReason, setSkipReason] = useState('Rifiuto del paziente')
  const [customSkipReason, setCustomSkipReason] = useState('')
  const [skipNotes, setSkipNotes] = useState('')

  const fetchMedData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const [medsRes, logsRes] = await Promise.all([
      getMedications(id as string, false),
      getMedicationLogs(id as string, selectedDate)
    ])
    if (medsRes.data) setMedications(medsRes.data)
    if (logsRes.data) setLogs(logsRes.data)
    setLoading(false)
  }, [id, selectedDate])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedData()
    }, 0)
    return () => clearTimeout(timer)
  }, [id, selectedDate, fetchMedData])

  const handleAdminister = async (medicationId: string, scheduledTime: string, status: 'given' | 'skipped' | 'refused', skipReasonStr?: string, adminNotes?: string) => {
    try {
      const res = await logMedicationAdministration({
        medication_id: medicationId,
        patient_id: id as string,
        scheduled_time: scheduledTime,
        status,
        skip_reason: skipReasonStr,
        notes: adminNotes
      })

      if (res.error) {
        toast.error(`Errore nella somministrazione: ${res.error}`)
      } else {
        toast.success(`Somministrazione registrata: ${status === 'given' ? 'Somministrato' : 'Saltato'}`)
        fetchMedData()
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      toast.error(msg)
    }
  }

  const handlePrescribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMedName || !newMedDosage) {
      toast.error('Nome e Dosaggio sono obbligatori')
      return
    }

    const timesArray = newMedTimes.split(',').map(t => t.trim()).filter(Boolean)

    const res = await createMedication({
      patient_id: id as string,
      name: newMedName,
      active_principle: newMedPrinciple || undefined,
      dosage: newMedDosage,
      route: newMedRoute,
      schedule: { times: timesArray, days: 'daily' },
      start_date: newMedStartDate,
      end_date: newMedEndDate || undefined,
      notes: newMedNotes || undefined,
      is_active: true
    })

    if (res.error) {
      toast.error(`Errore nella prescrizione: ${res.error}`)
    } else {
      toast.success('Terapia prescritta con successo')
      setIsPrescribeOpen(false)
      // Reset form
      setNewMedName('')
      setNewMedPrinciple('')
      setNewMedDosage('')
      setNewMedRoute('Orale')
      setNewMedTimes('08:00')
      setNewMedNotes('')
      fetchMedData()
    }
  }

  const handleSkipSubmit = () => {
    if (!skipLogData) return
    const finalReason = skipReason === 'Altro' ? customSkipReason : skipReason
    handleAdminister(skipLogData.medication_id, skipLogData.scheduled_time, skipLogData.status, finalReason, skipNotes)
    setIsSkipOpen(false)
    setSkipLogData(null)
    setSkipNotes('')
    setCustomSkipReason('')
  }

  // Costruisce la timeline della giornata selezionata
  const timelineSlots = ['08:00', '12:00', '16:00', '20:00', '22:00']
  
  // Raggruppa le terapie per orario teorico
  // Per ogni orario del farmaco attivo nel giorno selezionato
  const getTimelineItems = () => {
    const items: {
      med: Medication
      time: string
      log?: MedicationLog
    }[] = []

    medications.forEach(med => {
      // Controlla se la terapia è attiva per il giorno selezionato
      const isStarted = new Date(med.start_date) <= new Date(selectedDate)
      const isNotEnded = !med.end_date || new Date(med.end_date) >= new Date(selectedDate)
      if (med.is_active && isStarted && isNotEnded) {
        med.schedule.times.forEach(time => {
          const matchingLog = logs.find(
            l => l.medication_id === med.id &&
            new Date(l.scheduled_time).toISOString().substring(11, 16) === time
          )
          items.push({
            med,
            time,
            log: matchingLog
          })
        })
      }
    })

    // Ordina per orario
    return items.sort((a, b) => a.time.localeCompare(b.time))
  }

  const timelineItems = getTimelineItems()

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

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sinistra: Gestione ed Esecuzione Giornaliera */}
        <div className="flex-1 space-y-6">
          <Card className="border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-bold">Somministrazioni del Giorno</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40 h-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                </div>
              ) : timelineItems.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Nessuna terapia programmata per il giorno selezionato.
                </div>
              ) : (
                <div className="space-y-4">
                  {timelineItems.map((item, idx) => {
                    const scheduledDateTime = `${selectedDate}T${item.time}:00.000Z`
                    const isCompleted = item.log && item.log.status !== 'pending'
                    const statusColor = item.log?.status === 'given' ? 'secondary' : item.log?.status === 'skipped' ? 'outline' : item.log?.status === 'refused' ? 'destructive' : 'outline'

                    return (
                      <div
                        key={`${item.med.id}-${item.time}-${idx}`}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                          isCompleted ? 'bg-muted/30 border-border' : 'bg-card hover:bg-muted/10 border-border shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-lg ${isCompleted ? 'bg-muted' : 'bg-primary/10 text-primary'}`}>
                            <Pill className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-foreground">{item.med.name}</span>
                              {item.med.active_principle && (
                                <span className="text-xs text-muted-foreground">({item.med.active_principle})</span>
                              )}
                              <Badge variant={statusColor} className="text-[10px]">
                                {item.time}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Dosaggio: <strong>{item.med.dosage}</strong> • Via: <strong>{item.med.route}</strong>
                            </p>
                            {item.log && item.log.status !== 'pending' && (
                              <p className="text-[11px] text-muted-foreground mt-1 bg-muted/65 p-2 rounded-lg border border-border">
                                Stato: <strong>{item.log.status === 'given' ? '✓ Somministrato' : item.log.status === 'skipped' ? '✗ Saltato' : '✗ Rifiutato'}</strong>
                                {item.log.administered_by_profile && ` da ${item.log.administered_by_profile.full_name}`}
                                {item.log.skip_reason && ` - Causa: ${item.log.skip_reason}`}
                                {item.log.notes && ` (Note: ${item.log.notes})`}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Pulsanti somministrazione per staff */}
                        {isStaff() && !isCompleted && (
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAdminister(item.med.id, scheduledDateTime, 'given')}
                              className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            >
                              <Check className="h-4 w-4" /> Somministra
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSkipLogData({ medication_id: item.med.id, scheduled_time: scheduledDateTime, status: 'skipped' })
                                setIsSkipOpen(true)
                              }}
                              className="h-8 gap-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                            >
                              <X className="h-4 w-4" /> Salta
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSkipLogData({ medication_id: item.med.id, scheduled_time: scheduledDateTime, status: 'refused' })
                                setIsSkipOpen(true)
                              }}
                              className="h-8 gap-1 font-semibold"
                            >
                              <X className="h-4 w-4" /> Rifiuto
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Destra: Scheda Terapie Attive */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <Card className="border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" /> Terapie Attive
              </CardTitle>
              {role === 'doctor' && (
                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => setIsPrescribeOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-6 divide-y divide-border">
              {medications.filter(m => m.is_active).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nessun farmaco attivo prescritto.</p>
              ) : (
                medications
                  .filter(m => m.is_active)
                  .map((med) => (
                    <div key={med.id} className="py-3 first:pt-0 last:pb-0">
                      <h4 className="text-sm font-bold text-foreground">{med.name}</h4>
                      {med.active_principle && <p className="text-xs text-muted-foreground">{med.active_principle}</p>}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          Dosaggio: {med.dosage}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          Orari: {med.schedule.times.join(', ')}
                        </Badge>
                      </div>
                      {med.notes && (
                        <p className="text-[11px] text-muted-foreground mt-1.5 bg-muted/30 p-1.5 rounded border border-border">
                          {med.notes}
                        </p>
                      )}
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modale Prescrizione (Solo Medico) */}
      <Dialog open={isPrescribeOpen} onOpenChange={setIsPrescribeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prescrivi Nuova Terapia</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePrescribeSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="med-name">Nome Farmaco</Label>
              <Input id="med-name" placeholder="Es: Cardioaspirina" value={newMedName} onChange={(e) => setNewMedName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-principle">Principio Attivo</Label>
              <Input id="med-principle" placeholder="Es: Acido acetilsalicilico" value={newMedPrinciple} onChange={(e) => setNewMedPrinciple(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="med-dosage">Dosaggio</Label>
                <Input id="med-dosage" placeholder="Es: 100 mg" value={newMedDosage} onChange={(e) => setNewMedDosage(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-route">Via di Somministrazione</Label>
                <Input id="med-route" value={newMedRoute} onChange={(e) => setNewMedRoute(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-times">Orari Giornalieri (separati da virgola)</Label>
              <Input id="med-times" placeholder="Es: 08:00, 20:00" value={newMedTimes} onChange={(e) => setNewMedTimes(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="med-start">Data Inizio</Label>
                <Input id="med-start" type="date" value={newMedStartDate} onChange={(e) => setNewMedStartDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-end">Data Fine (Opzionale)</Label>
                <Input id="med-end" type="date" value={newMedEndDate} onChange={(e) => setNewMedEndDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-notes">Note / Istruzioni</Label>
              <Textarea id="med-notes" placeholder="Es: A stomaco pieno dopo colazione" value={newMedNotes} onChange={(e) => setNewMedNotes(e.target.value)} />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPrescribeOpen(false)}>Annulla</Button>
              <Button type="submit">Salva Prescrizione</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modale Salta / Rifiuto Somministrazione */}
      <Dialog open={isSkipOpen} onOpenChange={setIsSkipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registra Causa della Mancata Somministrazione</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="skip-reason">Motivazione</Label>
              <select
                id="skip-reason"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
              >
                <option value="Rifiuto del paziente">Rifiuto del paziente</option>
                <option value="Paziente addormentato">Paziente addormentato</option>
                <option value="Nausea / Vomito">Nausea / Vomito</option>
                <option value="Esame diagnostico in corso">Esame diagnostico in corso</option>
                <option value="Altro">Altro (specificare in nota)</option>
              </select>
            </div>
            {skipReason === 'Altro' && (
              <div className="space-y-2">
                <Label htmlFor="custom-reason">Descrivi Motivo</Label>
                <Input id="custom-reason" placeholder="Inserisci il motivo esatto" value={customSkipReason} onChange={(e) => setCustomSkipReason(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="skip-notes">Note Aggiuntive (Opzionale)</Label>
              <Textarea id="skip-notes" placeholder="Note per la cartella clinica" value={skipNotes} onChange={(e) => setSkipNotes(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSkipOpen(false)}>Annulla</Button>
              <Button onClick={handleSkipSubmit}>Registra</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
