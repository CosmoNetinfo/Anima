'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { usePatient } from '@/lib/hooks/usePatient'
import { PatientHeader } from '@/components/patients/PatientHeader'
import { PatientTabSwitcher } from '@/components/patients/PatientTabSwitcher'
import { getClinicalNotes, addClinicalNote } from '@/app/actions/diary'
import { ClinicalNote } from '@/types'
import { useUser } from '@/lib/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { FileText, EyeOff, Plus, Clipboard } from 'lucide-react'
import { toast } from 'sonner'

export default function PatientDiaryPage() {
  const { id } = useParams()
  const { currentPatient, loading: patientLoading } = usePatient(id as string)
  const { isStaff } = useUser()

  const [notes, setNotes] = useState<ClinicalNote[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<'general' | 'medical' | 'nursing' | 'psychological' | 'nutritional' | 'physiotherapy' | 'family_communication'>('general')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const fetchNotes = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const res = await getClinicalNotes(id as string)
    if (res.data) setNotes(res.data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes()
    }, 0)
    return () => clearTimeout(timer)
  }, [id, fetchNotes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      toast.error('Il contenuto della nota non può essere vuoto')
      return
    }

    setIsSubmitting(true)
    const res = await addClinicalNote({
      patient_id: id as string,
      category,
      content,
      is_private: isPrivate
    })
    setIsSubmitting(false)

    if (res.error) {
      toast.error(`Errore nel salvataggio: ${res.error}`)
    } else {
      toast.success('Annotazione aggiunta al diario clinico')
      setContent('')
      setIsOpen(false)
      fetchNotes()
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
        {/* Sinistra: Feed diario clinico */}
        <div className="flex-1 space-y-4">
          <Card className="border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-bold">Diario Clinico ed Annotazioni</CardTitle>
              </div>
              {isStaff() && (
                <Button size="sm" onClick={() => setIsOpen(!isOpen)} className="h-9 gap-1">
                  <Plus className="h-4 w-4" /> Aggiungi Nota
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {isOpen && isStaff() && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 border border-border rounded-xl space-y-4 bg-muted/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="note-category">Categoria Nota</Label>
                      <select
                        id="note-category"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ClinicalNote['category'])}
                      >
                        <option value="general">Generale</option>
                        <option value="medical">Medica</option>
                        <option value="nursing">Infermieristica</option>
                        <option value="psychological">Psicologica</option>
                        <option value="nutritional">Nutrizionale</option>
                        <option value="physiotherapy">Fisioterapica</option>
                        <option value="family_communication">Colloquio Famiglia</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-8 sm:pt-6">
                      <input
                        id="note-private"
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                      <Label htmlFor="note-private" className="flex items-center gap-1.5 cursor-pointer select-none">
                        <EyeOff className="h-4 w-4 text-muted-foreground" /> Nota Riservata allo Staff
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note-content">Contenuto Annotazione</Label>
                    <Textarea
                      id="note-content"
                      rows={4}
                      placeholder="Scrivi i dettagli dell'avvenimento, consegna o aggiornamento clinico..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annulla</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Salvataggio...' : 'Registra Nota'}
                    </Button>
                  </div>
                </form>
              )}

              {loading ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                </div>
              ) : notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Nessuna nota registrata nel diario clinico.</p>
              ) : (
                <div className="relative border-l border-border pl-6 space-y-6 py-2 ml-3">
                  {notes.map((note) => {
                    const authorRole = note.author_profile?.role || 'Staff'
                    const categoryLabel = note.category.replace(/_/g, ' ')

                    return (
                      <div key={note.id} className="relative group">
                        {/* Indicatore timeline */}
                        <div className="absolute -left-[31px] top-1.5 bg-background border border-border p-1.5 rounded-full z-10">
                          <Clipboard className="h-3.5 w-3.5 text-primary" />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-foreground">{note.author_profile?.full_name}</span>
                            <Badge variant="outline" className="text-[10px] uppercase">{authorRole}</Badge>
                            <Badge className="text-[10px] capitalize bg-primary/10 text-primary border-0">{categoryLabel}</Badge>
                            {note.is_private && (
                              <Badge variant="destructive" className="text-[9px] gap-1 select-none">
                                <EyeOff className="h-3 w-3" /> Riservato
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(note.created_at).toLocaleString('it-IT')}
                            </span>
                          </div>
                          <div className="text-sm text-foreground bg-muted/20 p-3 rounded-xl border border-border/50 max-w-3xl whitespace-pre-line leading-relaxed">
                            {note.content}
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
