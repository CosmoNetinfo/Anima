'use client'

import React, { useState } from 'react'
import { usePatient } from '@/lib/hooks/usePatient'
import { useUser } from '@/lib/hooks/useUser'
import { PatientSearch } from '@/components/patients/PatientSearch'
import { PatientCard } from '@/components/patients/PatientCard'
import { PatientForm } from '@/components/patients/PatientForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { UserPlus } from 'lucide-react'
import { PatientFormInput } from '@/lib/validators/patient'

export default function PatientsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { isStaff, isAdmin } = useUser()
  const {
    patients,
    loading,
    search,
    setSearch,
    ward,
    setWard,
    showInactive,
    setShowInactive,
    createPatient,
  } = usePatient()

  const canCreate = isAdmin() || isStaff() // Medico, Admin o Super Admin

  const handleCreateSubmit = async (data: PatientFormInput) => {
    const res = await createPatient(data)
    if (res.success) {
      setIsCreateOpen(false)
    }
    return res
  }

  return (
    <div className="space-y-6">
      {/* Header Pagina */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Gestione Pazienti</h2>
          <p className="text-muted-foreground text-sm">
            {"Visualizza e gestisci l'anagrafica, i dati clinici e lo stato dei pazienti in carico alla struttura."}
          </p>
        </div>

        {/* Pulsante Crea Paziente */}
        {canCreate && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/95 h-9 px-4 py-2 cursor-pointer select-none">
              <UserPlus className="h-4 w-4" /> Nuovo Paziente
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Inserisci Nuovo Paziente</DialogTitle>
              </DialogHeader>
              <PatientForm onSubmit={handleCreateSubmit} onCancel={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Ricerca e Filtri */}
      <PatientSearch
        search={search}
        onSearchChange={setSearch}
        ward={ward}
        onWardChange={setWard}
        showInactive={showInactive}
        onShowInactiveChange={setShowInactive}
      />

      {/* Lista/Tabella Pazienti */}
      {loading && patients.length === 0 ? (
        <div className="flex items-center justify-center py-20 bg-card rounded-xl border border-border">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-xl space-y-3">
          <p className="text-muted-foreground text-sm font-medium">Nessun paziente trovato corrisponde ai criteri cercati.</p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-0 md:bg-card md:border md:border-border md:rounded-xl md:overflow-hidden md:shadow-sm">
          {/* Vista Mobile (lista semplice di card) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {patients.map((p) => (
              <PatientCard key={p.id} patient={p} />
            ))}
          </div>

          {/* Vista Desktop (Tabella) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border select-none">
                  <th className="py-3 px-6 text-xs uppercase font-bold text-muted-foreground tracking-wider">Paziente</th>
                  <th className="py-3 px-6 text-xs uppercase font-bold text-muted-foreground tracking-wider">Dettagli</th>
                  <th className="py-3 px-6 text-xs uppercase font-bold text-muted-foreground tracking-wider">Reparto & Stanza</th>
                  <th className="py-3 px-6 text-xs uppercase font-bold text-muted-foreground tracking-wider">Stato Clinico</th>
                  <th className="py-3 px-6 text-xs uppercase font-bold text-muted-foreground tracking-wider text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <PatientCard key={p.id} patient={p} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
