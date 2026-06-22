'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { useAppStore } from '@/lib/stores/appStore'
import { updateProfileAccessibilitySettings } from '@/app/actions/profile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, Eye, Zap, Type, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { profile, loading } = useUser()
  const {
    patientLargeFont,
    setPatientLargeFont,
    patientHighContrast,
    setPatientHighContrast,
    patientMotionReduced,
    setPatientMotionReduced
  } = useAppStore()

  // State local per i controlli del form
  const [largeFont, setLargeFont] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [motionReduced, setMotionReduced] = useState(false)
  const [saving, setSaving] = useState(false)

  // Inizializza i controlli con i valori dello store o del profilo
  useEffect(() => {
    if (profile) {
      const timer = setTimeout(() => {
        setLargeFont(profile.large_font_mode ?? false)
        setHighContrast(profile.high_contrast_mode ?? false)
        setMotionReduced(profile.motion_reduced ?? false)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [profile?.id])

  const handleSave = async () => {
    setSaving(true)
    const res = await updateProfileAccessibilitySettings({
      large_font_mode: largeFont,
      high_contrast_mode: highContrast,
      motion_reduced: motionReduced
    })
    setSaving(false)

    if (res.error) {
      toast.error('Errore nel salvataggio delle impostazioni: ' + res.error)
    } else {
      // Aggiorna lo store Zustand locale per l'applicazione immediata
      setPatientLargeFont(largeFont)
      setPatientHighContrast(highContrast)
      setPatientMotionReduced(motionReduced)
      
      toast.success('Preferenze salvate ed applicate con successo!')
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
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-foreground">Impostazioni e Accessibilità</h2>
        <p className="text-xs text-muted-foreground mt-0.5 font-medium">{"Personalizza l'interfaccia utente in base alle tue preferenze visive e motorie."}</p>
      </div>

      {profile && (
        <Card className="border border-border shadow-sm rounded-2xl bg-card">
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Profilo Utente</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Nominativo</span>
              <strong className="text-foreground">{profile.full_name}</strong>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Ruolo Account</span>
              <Badge variant="outline" className="capitalize text-[10px] mt-0.5">{profile.role}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controlli Accessibilità */}
      <Card className="border border-border shadow-sm rounded-2xl">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" /> Preferenze Visualizzazione
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Caratteri grandi */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0 h-9 w-9 flex items-center justify-center">
                <Type className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="large-font-toggle" className="text-sm font-bold text-foreground cursor-pointer">Caratteri Grandi (Large Fonts)</Label>
                <p className="text-xs text-muted-foreground leading-normal">
                  Aumenta la dimensione del testo e degli elementi touch per rendere più semplice la lettura (attivo di default per i pazienti).
                </p>
              </div>
            </div>
            <input
              id="large-font-toggle"
              type="checkbox"
              checked={largeFont}
              onChange={(e) => setLargeFont(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-5 w-5 cursor-pointer shrink-0"
            />
          </div>

          {/* Contrasto Elevato */}
          <div className="flex items-start justify-between gap-4 pt-4 border-t border-border/50">
            <div className="flex gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0 h-9 w-9 flex items-center justify-center">
                <Eye className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="high-contrast-toggle" className="text-sm font-bold text-foreground cursor-pointer">Contrasto Elevato</Label>
                <p className="text-xs text-muted-foreground leading-normal">
                  {"Utilizza colori più caldi e contrasti marcati per migliorare la leggibilità e l'orientamento visivo."}
                </p>
              </div>
            </div>
            <input
              id="high-contrast-toggle"
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-5 w-5 cursor-pointer shrink-0"
            />
          </div>

          {/* Riduzione Animazioni */}
          <div className="flex items-start justify-between gap-4 pt-4 border-t border-border/50">
            <div className="flex gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0 h-9 w-9 flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="motion-reduced-toggle" className="text-sm font-bold text-foreground cursor-pointer">Riduzione Animazioni</Label>
                <p className="text-xs text-muted-foreground leading-normal">
                  {"Disabilita le transizioni di movimento complesse e gli effetti zoom, riducendo l'affaticamento visivo."}
                </p>
              </div>
            </div>
            <input
              id="motion-reduced-toggle"
              type="checkbox"
              checked={motionReduced}
              onChange={(e) => setMotionReduced(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-5 w-5 cursor-pointer shrink-0"
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-1.5 font-bold">
              <Save className="h-4 w-4" /> {saving ? 'Salvataggio...' : 'Salva Preferenze'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
