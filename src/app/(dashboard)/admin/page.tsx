'use client'

import React, { useEffect, useState } from 'react'
import { getUsers, updateProfile, getAuditLogs, inviteUser } from '@/app/actions/admin'
import { Profile } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Users, FileText, Plus, ShieldCheck, ShieldAlert, Key } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users')

  // Invito utente
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'patient' | 'caregiver' | 'nurse' | 'doctor' | 'admin'>('nurse')
  const [submittingInvite, setSubmittingInvite] = useState(false)

  // Modifica utente
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editActive, setEditActive] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const [uRes, aRes] = await Promise.all([
      getUsers(),
      getAuditLogs()
    ])
    if (uRes.data) setUsers(uRes.data)
    if (aRes.data) setAuditLogs(aRes.data)
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail || !inviteName) {
      toast.error('Email e Nome completo sono richiesti')
      return
    }

    setSubmittingInvite(true)
    const res = await inviteUser(inviteEmail, inviteName, inviteRole)
    setSubmittingInvite(false)

    if (res.error) {
      toast.error(`Errore nell'invio: ${res.error}`)
    } else {
      toast.success('Utente invitato con successo!')
      setIsInviteOpen(false)
      setInviteEmail('')
      setInviteName('')
      loadData()
    }
  }

  const handleEditSave = async () => {
    if (!editingUser) return
    const res = await updateProfile(editingUser.id, {
      role: editRole,
      is_active: editActive
    })

    if (res.error) {
      toast.error(`Errore nel salvataggio: ${res.error}`)
    } else {
      toast.success('Profilo aggiornato con successo')
      setEditingUser(null)
      loadData()
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground">Pannello di Amministrazione</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Gestisci i collaboratori della struttura, controlla gli accessi ed esamina i log di sicurezza.</p>
        </div>
        {activeTab === 'users' && (
          <Button onClick={() => setIsInviteOpen(true)} className="gap-1.5 font-bold">
            <Plus className="h-4 w-4" /> Invita Utente
          </Button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Gestione Collaboratori</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'audit' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Registro Audit Log</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      ) : activeTab === 'users' ? (
        <Card className="border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-foreground font-bold">
                    <th className="pb-3">Nome Utente</th>
                    <th className="pb-3">Ruolo</th>
                    <th className="pb-3">Stato</th>
                    <th className="pb-3 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3.5 font-bold text-foreground">{u.full_name}</td>
                      <td className="py-3.5">
                        <Badge variant="outline" className="capitalize text-[10px]">{u.role}</Badge>
                      </td>
                      <td className="py-3.5">
                        <Badge variant={u.is_active ? 'secondary' : 'destructive'} className="text-[9px]">
                          {u.is_active ? 'Attivo' : 'Disattivato'}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-right">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            setEditingUser(u)
                            setEditRole(u.role)
                            setEditActive(u.is_active)
                          }}
                        >
                          Modifica
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nessun log registrato.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="py-3 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider">{log.action}</Badge>
                          <span className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString('it-IT')}</span>
                        </div>
                        <p className="text-xs text-foreground">
                          Eseguito da: <strong>{log.profile?.full_name || 'Sistema'}</strong>
                        </p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <pre className="text-[10px] bg-muted/65 p-2 rounded-lg border border-border overflow-x-auto max-w-2xl font-mono text-muted-foreground">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                      <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Modifica Collaboratore */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestione Profilo Collaboratore</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Nominativo</span>
                <strong className="text-sm text-foreground">{editingUser.full_name}</strong>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Ruolo Assegnato</Label>
                <select
                  id="edit-role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                >
                  <option value="patient">Paziente</option>
                  <option value="caregiver">Caregiver</option>
                  <option value="nurse">Infermiere</option>
                  <option value="doctor">Medico</option>
                  <option value="admin">Amministratore</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="edit-active"
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
                <Label htmlFor="edit-active" className="cursor-pointer select-none">Profilo Attivo ed Abilitato</Label>
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>Annulla</Button>
                <Button onClick={handleEditSave}>Salva Modifiche</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Invita Utente */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invita Collaboratore o Ospite</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInviteSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Nome Completo</Label>
              <Input
                id="invite-name"
                placeholder="Es: Dott. Marco Bianchi"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Indirizzo Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="Es: marco.bianchi@esempio.it"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Ruolo</Label>
              <select
                id="invite-role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={inviteRole}
                onChange={(e: any) => setInviteRole(e.target.value)}
              >
                <option value="patient">Paziente</option>
                <option value="caregiver">Caregiver</option>
                <option value="nurse">Infermiere (Nurse)</option>
                <option value="doctor">Medico (Doctor)</option>
                <option value="admin">Amministratore (Admin)</option>
              </select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>Annulla</Button>
              <Button type="submit" disabled={submittingInvite}>
                {submittingInvite ? 'Invio in corso...' : 'Invia Invito'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
