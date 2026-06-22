'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { getAppointments, createAppointment } from '@/app/actions/appointments'
import { getPatients } from '@/app/actions/patients'
import { Appointment, Patient } from '@/types'
import { useUser } from '@/lib/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function CalendarPage() {
  const { isStaff, profile } = useUser()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('30')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const profileRole = profile?.role

  const loadData = useCallback(async () => {
    setLoading(true)
    const staffRoles = ['admin', 'super_admin', 'doctor', 'nurse']
    const userIsStaff = profileRole ? staffRoles.includes(profileRole) : false
    const [appRes, ptsRes] = await Promise.all([
      getAppointments(),
      userIsStaff ? getPatients() : Promise.resolve({ data: [], error: null })
    ])
    if (appRes.data) setAppointments(appRes.data)
    if (ptsRes.data) setPatients(ptsRes.data)
    setLoading(false)
  }, [profileRole])

  useEffect(() => {
    if (profile) {
      const timer = setTimeout(() => {
        loadData()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [profile?.id, loadData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !date || !time) {
      toast.error('Titolo, data e orario sono obbligatori')
      return
    }

    setIsSubmitting(true)
    const appDateTime = `${date}T${time}:00.000Z`
    const res = await createAppointment({
      patient_id: selectedPatientId || undefined,
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
      toast.success('Appuntamento inserito in agenda')
      setTitle('')
      setDescription('')
      setLocation('')
      setDate('')
      setTime('')
      setSelectedPatientId('')
      setIsOpen(false)
      loadData()
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground">Agenda Condivisa</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Gestione delle visite, incontri di famiglia e attività cliniche della struttura.</p>
        </div>
        {isStaff() && (
          <Button onClick={() => setIsOpen(!isOpen)} className="gap-1.5 font-bold">
            <Plus className="h-4 w-4" /> Nuovo Appuntamento
          </Button>
        )}
      </div>

      {isOpen && isStaff() && (
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pianifica Appuntamento</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="app-title">Titolo Appuntamento</Label>
                  <Input
                    id="app-title"
                    placeholder="Es: Controllo Fisioterapico"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-patient">Associa Ospite (Opzionale)</Label>
                  <select
                    id="app-patient"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                  >
                    <option value="">Nessuno (Generale Struttura)</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-loc">Luogo / Ambulatorio</Label>
                  <Input
                    id="app-loc"
                    placeholder="Es: Sala Riabilitazione"
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
                <Label htmlFor="app-desc">Dettagli / Istruzioni</Label>
                <Input
                  id="app-desc"
                  placeholder="Note utili"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annulla</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvataggio...' : 'Conferma Appuntamento'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border border-border shadow-sm">
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Nessun appuntamento in agenda.</p>
          ) : (
            <div className="space-y-4">
              {appointments.map((app) => {
                const statusColor = app.status === 'scheduled' ? 'secondary' : app.status === 'completed' ? 'outline' : app.status === 'cancelled' ? 'destructive' : 'default'

                return (
                  <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border rounded-xl bg-card hover:bg-muted/5 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-primary/10 text-primary rounded-lg shrink-0">
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
                          {app.patient && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Ospite: {app.patient.full_name}</span>}
                        </div>
                        {app.description && (
                          <p className="text-[11px] text-muted-foreground mt-2 bg-muted/40 p-2 rounded-lg border border-border max-w-3xl">
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
  )
}
