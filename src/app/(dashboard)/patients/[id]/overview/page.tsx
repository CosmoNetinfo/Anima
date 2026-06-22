'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { usePatient } from '@/lib/hooks/usePatient'
import { PatientHeader } from '@/components/patients/PatientHeader'
import { PatientTabSwitcher } from '@/components/patients/PatientTabSwitcher'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, ShieldAlert, Heart, Calendar, FileText, User } from 'lucide-react'

export default function PatientOverviewPage() {
  const { id } = useParams()
  const { currentPatient, loading } = usePatient(id as string)

  if (loading && !currentPatient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!currentPatient) {
    return (
      <div className="text-center py-10 bg-card rounded-xl border border-border">
        <p className="text-muted-foreground text-sm font-medium">Paziente non trovato.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Clinica PatientHeader */}
      <PatientHeader patient={currentPatient} />

      {/* Tabs di navigazione del fascicolo */}
      <PatientTabSwitcher patientId={currentPatient.id} />

      {/* Dettagli Panoramica */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonna Sinistra: Anagrafica Completa */}
        <Card className="md:col-span-2 border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-border">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-bold">Anagrafica Completa</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Codice Fiscale</span>
              <strong className="text-foreground uppercase">{currentPatient.fiscal_code || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Gruppo Sanguigno</span>
              <strong className="text-foreground">{currentPatient.blood_type || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Data di Nascita</span>
              <strong className="text-foreground">{new Date(currentPatient.birth_date).toLocaleDateString('it-IT')}</strong>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Genere</span>
              <strong className="text-foreground">{currentPatient.gender === 'M' ? 'Maschio' : currentPatient.gender === 'F' ? 'Femmina' : 'Altro'}</strong>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Indirizzo</span>
              <strong className="text-foreground">{currentPatient.address || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Telefono</span>
              <strong className="text-foreground">{currentPatient.phone || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Data Ingresso in Struttura</span>
              <strong className="text-foreground">
                {currentPatient.admission_date ? new Date(currentPatient.admission_date).toLocaleDateString('it-IT') : 'N/A'}
              </strong>
            </div>
          </CardContent>
        </Card>

        {/* Colonna Destra: Contatti di Emergenza */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-border">
            <ShieldAlert className="h-5 w-5 text-danger" />
            <CardTitle className="text-base font-bold">Contatti di Emergenza</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-sm">
            {currentPatient.emergency_contact_name ? (
              <div className="space-y-3 bg-danger/5 border border-danger/10 p-4 rounded-xl">
                <div>
                  <span className="text-xs text-muted-foreground block">Nome Referente</span>
                  <strong className="text-foreground font-semibold">{currentPatient.emergency_contact_name}</strong>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Telefono di Contatto</span>
                  <a
                    href={`tel:${currentPatient.emergency_contact_phone}`}
                    className="text-primary font-bold text-sm hover:underline block"
                  >
                    {currentPatient.emergency_contact_phone}
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-6">
                Nessun contatto di emergenza registrato.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Note e Diario di Base */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-border">
          <FileText className="h-5 w-5 text-clinical" />
          <CardTitle className="text-base font-bold">Note e Anamnesi di Base</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-sm leading-relaxed text-foreground">
          {currentPatient.notes ? (
            <p className="whitespace-pre-line">{currentPatient.notes}</p>
          ) : (
            <p className="text-xs text-muted-foreground italic">Nessuna nota clinica o anamnesi di base specificata.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
