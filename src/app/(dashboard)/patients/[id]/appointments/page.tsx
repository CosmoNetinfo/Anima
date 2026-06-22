'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { usePatient } from '@/lib/hooks/usePatient'
import { PatientHeader } from '@/components/patients/PatientHeader'
import { PatientTabSwitcher } from '@/components/patients/PatientTabSwitcher'
import { getAppointments, createAppointment } from '@/app/actions/appointments'
import { Appointment } from '@/types'
import { useUser } from '@/lib/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, Clock, MapPin, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function PatientAppointmentsPage() {
  const { id } = useParams()
  const { currentPatient, loading: patientLoading } = usePatient(id as string)
  const { isStaff } = useUser()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('30')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const fetchApps = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const res = await getAppointments(id as string)
    if (res.data) setAppointments(res.data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApps()
    }, 0)
    return () => clearTimeout(timer)
  }, [id, fetchApps])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !date || !time) {
      toast.error('Titolo, data e orario sono obbligatori')
      return
    }

    setIsSubmitting(true)
    const appDateTime = `${date}T${time}:00.000Z`
    const res = await createAppointment({
      patient_id: id as string,
      title,
      description: description || undefined,
      location: location || undefined,
      appointment_at: appDateTime,
      duration_min: parseInt(duration) || 30
    })
    setIsSubmitting(false)

    if (res.error) {
      toast.error(`Errore durante la creazione: ${res.error}`)
    } else {
      toast.success('Appuntamento pianificato con successo!')
      setTitle('')
      setDescription('')
      setLocation('')
      setDate('')
      setTime('')
      setIsOpen(false)
      fetchApps()
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

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <Card className="border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-bold">Appuntamenti ed Agenda</CardTitle>
              </div>
              {isStaff() && (
                <Button size="sm" onClick={() => setIsOpen(!isOpen)} className="h-9 gap-1">
                  <Plus className="h-4 w-4" /> Pianifica Visita
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {isOpen && isStaff() && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 border border-border rounded-xl space-y-4 bg-muted/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="app-title">Titolo Appuntamento</Label>
                      <Input
                        id="app-title"
                        placeholder="Es: Visita di controllo cardiologica"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="app-loc">Luogo / Ambulatorio</Label>
                      <Input
                        id="app-loc"
                        placeholder="Es: Ambulatorio A, Piano Terra"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="app-date">Data</Label>
                      <Input
                        id="app-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="app-time">Orario</Label>
                        <Input
                          id="app-time"
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="app-dur">Durata (minuti)</Label>
                        <Input
                          id="app-dur"
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app-desc">Dettagli / Note Cliniche</Label>
                    <Input
                      id="app-desc"
                      placeholder="Es: Digiuno dalle ore 00:00 del giorno precedente"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annulla</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Salvataggio...' : 'Conferma Appuntamento'}
                    </Button>
                  </div>
                </form>
              )}

              {loading ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                </div>
              ) : appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Nessun appuntamento pianificato per questo ospite.</p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((app) => {
                    const statusColor = app.status === 'scheduled' ? 'secondary' : app.status === 'completed' ? 'outline' : app.status === 'cancelled' ? 'destructive' : 'default'

                    return (
                      <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border rounded-xl bg-card">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                            <CalendarIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-foreground">{app.title}</span>
                              <Badge variant={statusColor} className="text-[9px] uppercase">{app.status}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(app.appointment_at).toLocaleString('it-IT')} ({app.duration_min} min)</span>
                              {app.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {app.location}</span>}
                            </div>
                            {app.description && (
                              <p className="text-[11px] text-muted-foreground mt-2 bg-muted/40 p-2 rounded-lg border border-border">
                                {app.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
