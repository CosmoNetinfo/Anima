'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { getAppointments, createAppointment } from '@/app/actions/appointments'
import { getPatients } from '@/app/actions/patients'
import { Appointment, Patient } from '@/types'
import { useUser } from '@/lib/hooks/useUser'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  User, 
  List, 
  Grid,
  X,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type CalendarView = 'month' | 'agenda'

export default function CalendarPage() {
  const { isStaff, profile } = useUser()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<CalendarView>('month')
  
  // Date states
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  // Modal Nuovo Appuntamento
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('30')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Popover Dettaglio Appuntamento
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null)

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
      loadData()
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
      setIsNewOpen(false)
      loadData()
    }
  }

  // --- CALCOLO GIORNI GRIGLIA MENSILA (Google Calendar style) ---
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    // getDay() restituisce 0 per Domenica, spostiamo per far iniziare il lunedì (0=Lun, 6=Dom)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1
    if (startDayOfWeek < 0) startDayOfWeek = 6 // Domenica diventa 6

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const cells = []

    // 1. Riempi giorni del mese precedente
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      })
    }

    // 2. Riempi giorni del mese corrente
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }

    // 3. Riempi giorni del mese successivo fino a completare le righe (multiplo di 7, di solito 42 celle)
    const remainingCells = 42 - cells.length
    for (let i = 1; i <= remainingCells; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }

    return cells
  }, [currentDate])

  // Raggruppa gli appuntamenti per data YYYY-MM-DD
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    appointments.forEach(app => {
      const dateKey = new Date(app.appointment_at).toISOString().split('T')[0]
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(app)
    })
    return map
  }, [appointments])

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDayClick = (dayDate: Date) => {
    if (!isStaff()) return
    const year = dayDate.getFullYear()
    const month = String(dayDate.getMonth() + 1).padStart(2, '0')
    const day = String(dayDate.getDate()).padStart(2, '0')
    setDate(`${year}-${month}-${day}`)
    
    // Imposta un'ora di default (es. ora successiva corrente)
    const currentHour = new Date().getHours()
    const defaultTime = `${String((currentHour + 1) % 24).padStart(2, '0')}:00`
    setTime(defaultTime)
    
    setIsNewOpen(true)
  }

  const formattedMonthYear = currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER CONTROLLI CALENDARIO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground capitalize">{formattedMonthYear}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Gestione visite, terapie ed eventi di struttura.</p>
          </div>
        </div>

        {/* NAVIGAZIONE INTERNA */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-lg"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-8 font-bold px-3 text-xs rounded-lg"
              onClick={handleToday}
            >
              Oggi
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-lg"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* SWITCH VISTA */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
              <Button 
                variant={view === 'month' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-8 text-xs font-bold px-3 rounded-lg flex items-center gap-1"
                onClick={() => setView('month')}
              >
                <Grid className="h-3.5 w-3.5" /> Mese
              </Button>
              <Button 
                variant={view === 'agenda' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-8 text-xs font-bold px-3 rounded-lg flex items-center gap-1"
                onClick={() => setView('agenda')}
              >
                <List className="h-3.5 w-3.5" /> Agenda
              </Button>
            </div>

            {isStaff() && (
              <Button 
                onClick={() => {
                  const todayStr = new Date().toISOString().split('T')[0]
                  setDate(todayStr)
                  setTime('10:00')
                  setIsNewOpen(true)
                }} 
                className="h-9 px-3 rounded-xl font-bold text-xs gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Nuovo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* VISTA A GRIGLIA MENSILE (Google Calendar style) */}
      {view === 'month' && (
        <Card className="border border-border shadow-sm overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            {/* Giorni della settimana */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center font-bold text-xs text-muted-foreground py-2.5">
              {weekDays.map(d => (
                <div key={d} className="select-none">{d}</div>
              ))}
            </div>

            {/* Celle dei giorni */}
            {loading ? (
              <div className="flex items-center justify-center min-h-[450px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-7 divide-x divide-y divide-border/60 bg-border/20">
                {monthData.map((cell, i) => {
                  const dateStr = cell.date.toISOString().split('T')[0]
                  const dayEvents = appointmentsByDate[dateStr] || []
                  
                  const isToday = new Date().toDateString() === cell.date.toDateString()

                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "min-h-[105px] bg-card p-1.5 flex flex-col justify-between transition-colors relative group",
                        !cell.isCurrentMonth && "bg-muted/30 text-muted-foreground/50",
                        isStaff() && "cursor-pointer hover:bg-muted/10"
                      )}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('.event-badge')) return
                        handleDayClick(cell.date)
                      }}
                    >
                      {/* Giorno Numero */}
                      <div className="flex justify-between items-center mb-1">
                        <span 
                          className={cn(
                            "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full select-none",
                            isToday && "bg-primary text-white font-extrabold",
                            cell.isCurrentMonth && !isToday && "text-foreground",
                            !cell.isCurrentMonth && "text-muted-foreground/40"
                          )}
                        >
                          {cell.date.getDate()}
                        </span>
                        
                        {/* Eventi extra indicator */}
                        {dayEvents.length > 2 && (
                          <span className="text-[9px] font-bold text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded-full select-none">
                            +{dayEvents.length - 2}
                          </span>
                        )}
                      </div>

                      {/* Eventi all'interno della cella */}
                      <div className="flex-1 space-y-1 overflow-hidden mt-1 flex flex-col justify-start">
                        {dayEvents.slice(0, 2).map(app => {
                          return (
                            <div
                              key={app.id}
                              onClick={() => setSelectedApp(app)}
                              className={cn(
                                "event-badge px-2 py-0.5 text-[10px] font-semibold rounded-md truncate cursor-pointer transition-all hover:brightness-95 border",
                                app.status === 'completed'
                                  ? "bg-muted/80 text-muted-foreground border-transparent line-through"
                                  : app.status === 'cancelled'
                                  ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                  : "bg-primary/10 text-primary border-primary/20 hover:scale-[1.01]"
                              )}
                              title={app.title}
                            >
                              <span className="font-bold mr-1">
                                {new Date(app.appointment_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {app.title}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* VISTA AGENDA / LISTA */}
      {view === 'agenda' && (
        <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <AlertCircle className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                <p className="text-sm text-muted-foreground">Nessun appuntamento pianificato in agenda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((app) => {
                  const statusColor = app.status === 'scheduled' ? 'secondary' : app.status === 'completed' ? 'outline' : app.status === 'cancelled' ? 'destructive' : 'default'
                  
                  return (
                    <div 
                      key={app.id} 
                      onClick={() => setSelectedApp(app)}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border rounded-2xl bg-card hover:bg-muted/5 transition-all cursor-pointer shadow-sm hover:translate-x-0.5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                          <CalendarIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground">{app.title}</span>
                            <Badge variant={statusColor} className="text-[9px] uppercase font-bold">{app.status}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground mt-1.5 font-medium">
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary/70" /> {new Date(app.appointment_at).toLocaleString('it-IT')} ({app.duration_min} min)</span>
                            {app.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary/70" /> {app.location}</span>}
                            {app.patient && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-primary/70" /> Ospite: {app.patient.full_name}</span>}
                          </div>
                          {app.description && (
                            <p className="text-xs text-muted-foreground mt-2 font-normal line-clamp-2">
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
      )}

      {/* DIALOG DETTAGLIO EVENTO (Google Calendar click style) */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          {selectedApp && (
            <>
              <DialogHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={selectedApp.status === 'scheduled' ? 'secondary' : selectedApp.status === 'completed' ? 'outline' : 'destructive'}
                    className="text-[9px] uppercase font-bold"
                  >
                    {selectedApp.status}
                  </Badge>
                </div>
                <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2 mt-2">
                  {selectedApp.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4 text-xs font-medium text-muted-foreground border-y border-border">
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-foreground font-bold">Data & Orario</p>
                    <p className="text-[11px] mt-0.5">
                      {new Date(selectedApp.appointment_at).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-[11px] mt-0.5">
                      ore {new Date(selectedApp.appointment_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} ({selectedApp.duration_min} minuti)
                    </p>
                  </div>
                </div>

                {selectedApp.location && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground font-bold">Luogo</p>
                      <p className="text-[11px] mt-0.5">{selectedApp.location}</p>
                    </div>
                  </div>
                )}

                {selectedApp.patient && (
                  <div className="flex items-start gap-2.5">
                    <User className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground font-bold">Ospite Associato</p>
                      <p className="text-[11px] mt-0.5">{selectedApp.patient.full_name}</p>
                    </div>
                  </div>
                )}

                {selectedApp.description && (
                  <div className="bg-muted/40 p-3 rounded-xl border border-border mt-2">
                    <p className="text-foreground font-bold text-[11px]">Dettagli / Istruzioni</p>
                    <p className="text-xs font-normal text-muted-foreground mt-1 leading-relaxed">
                      {selectedApp.description}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-2">
                <Button variant="outline" className="w-full sm:w-auto font-bold rounded-xl" onClick={() => setSelectedApp(null)}>
                  Chiudi
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG PIANIFICAZIONE / CREAZIONE */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">Pianifica Appuntamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-bold text-muted-foreground">Titolo</Label>
                <Input
                  id="title"
                  placeholder="Es: Visita Neurologica"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="patient" className="text-xs font-bold text-muted-foreground">Ospite (Opzionale)</Label>
                <select
                  id="patient"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  <option value="">Nessuno (Evento di Struttura)</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="loc" className="text-xs font-bold text-muted-foreground">Luogo</Label>
                <Input
                  id="loc"
                  placeholder="Es: Ambulatorio A"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs font-bold text-muted-foreground">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="time" className="text-xs font-bold text-muted-foreground">Orario</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="duration" className="text-xs font-bold text-muted-foreground">Durata (Minuti)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc" className="text-xs font-bold text-muted-foreground">Dettagli / Istruzioni</Label>
              <Textarea
                id="desc"
                placeholder="Inserisci dettagli utili..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border mt-4">
              <Button type="button" variant="outline" className="font-bold rounded-xl" onClick={() => setIsNewOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" className="font-bold rounded-xl" disabled={isSubmitting}>
                {isSubmitting ? 'Salvataggio...' : 'Conferma Appuntamento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
