'use client'

import React, { useState } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldAlert, Phone } from 'lucide-react'

export function SOSButton() {
  const { profile, isPatient } = useUser()
  const [isOpen, setIsOpen] = useState(false)

  if (!isPatient()) return null

  // Ottieni i contatti di emergenza dal profilo del paziente
  const contacts: { name: string; phone: string; relationship?: string }[] = profile?.emergency_contacts || []

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 bg-danger hover:bg-danger/90 text-white rounded-full flex flex-col items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 z-50 animate-pulse border-2 border-white/20"
      >
        <ShieldAlert className="h-6 w-6" />
        <span className="text-[10px] font-bold uppercase mt-0.5">SOS</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md border-danger/20">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-black text-danger flex items-center justify-center gap-2">
              <ShieldAlert className="h-6 w-6 animate-bounce" /> CONTATTI DI EMERGENZA
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">Chiama immediatamente un assistente o un familiare in caso di necessità.</p>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {contacts.length === 0 ? (
              <div className="text-center py-4 bg-muted/30 rounded-xl">
                <p className="text-sm font-semibold text-muted-foreground">Nessun contatto di emergenza configurato.</p>
                <p className="text-xs text-muted-foreground mt-1">{"Contatta l'amministratore per aggiungere contatti al tuo profilo."}</p>
              </div>
            ) : (
              contacts.map((contact, index) => (
                <a
                  key={index}
                  href={`tel:${contact.phone}`}
                  className="flex items-center justify-between p-4 bg-danger/5 hover:bg-danger/10 border border-danger/10 rounded-2xl transition-all hover:scale-[1.01]"
                >
                  <div>
                    <span className="text-base font-bold text-foreground block">{contact.name}</span>
                    {contact.relationship && (
                      <span className="text-xs text-muted-foreground">({contact.relationship})</span>
                    )}
                  </div>
                  <Button size="icon" variant="destructive" className="h-10 w-10 rounded-full shrink-0">
                    <Phone className="h-5 w-5 fill-white" />
                  </Button>
                </a>
              ))
            )}

            {/* Pulsante rapido chiamata reception/reparto */}
            <a
              href="tel:112"
              className="flex items-center justify-between p-4 bg-muted/40 hover:bg-muted/65 border border-border rounded-2xl transition-all"
            >
              <div>
                <span className="text-base font-bold text-foreground block">Numero Unico Emergenza</span>
                <span className="text-xs text-muted-foreground">{"Chiamata d'emergenza esterna"}</span>
              </div>
              <Button size="icon" variant="outline" className="h-10 w-10 rounded-full shrink-0">
                <Phone className="h-5 w-5" />
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
