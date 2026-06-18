'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Activity } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isMagicLink, setIsMagicLink] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        toast.success('Link di accesso inviato! Controlla la tua email.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        toast.success('Accesso effettuato con successo!')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.message || 'Errore durante l\'accesso.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-light/40 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center space-y-2 select-none">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary">
            <Activity className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">Anima</h2>
          <p className="text-sm text-muted-foreground font-medium">Cura che connette</p>
        </div>

        <Card className="border border-border/80 shadow-xl bg-card/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle>{isMagicLink ? 'Accedi con Magic Link' : 'Accedi ad Anima'}</CardTitle>
            <CardDescription>
              {isMagicLink
                ? 'Inserisci la tua email per ricevere un link di accesso rapido.'
                : 'Inserisci le tue credenziali per accedere al pannello.'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@struttura.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {!isMagicLink && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full font-semibold" disabled={loading}>
                {loading ? 'Caricamento...' : isMagicLink ? 'Invia Magic Link' : 'Accedi'}
              </Button>

              <button
                type="button"
                onClick={() => setIsMagicLink(!isMagicLink)}
                className="text-xs text-primary hover:underline font-medium transition-all"
              >
                {isMagicLink ? 'Accedi con Password' : 'Accedi con Magic Link'}
              </button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground">
          L\'accesso ad Anima è riservato al personale autorizzato e ai familiari invitati.
        </p>
      </div>
    </div>
  )
}
