'use client'

import React, { useState } from 'react'
import { useDebugStore } from '@/lib/stores/debugStore'
import { useUser } from '@/lib/hooks/useUser'
import { UserRole } from '@/types'
import { Bug, X, Trash2, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DebugConsole() {
  const [isOpen, setIsOpen] = useState(false)
  const { logs, clearLogs, overrideRole, setOverrideRole } = useDebugStore()
  const { profile } = useUser()

  // Solo in ambiente di sviluppo
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const roles: { value: UserRole | null; label: string }[] = [
    { value: null, label: 'Nessuno (Usa login)' },
    { value: 'patient', label: 'Paziente (Memora)' },
    { value: 'caregiver', label: 'Caregiver' },
    { value: 'nurse', label: 'Infermiere (CareLink)' },
    { value: 'doctor', label: 'Medico' },
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' },
  ]

  return (
    <>
      {/* Bottone Flottante 🐛 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 z-50 h-10 w-10 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-all scale-100 hover:scale-105"
        title="Apri Console Debug"
      >
        <Bug className="h-5 w-5 animate-pulse" />
      </button>

      {/* Modal/Console Debug */}
      {isOpen && (
        <div className="fixed inset-y-0 left-0 w-80 bg-zinc-950 text-zinc-100 shadow-2xl border-r border-zinc-800 z-[9999] flex flex-col font-mono text-xs">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-2 text-destructive font-semibold">
              <Bug className="h-4 w-4" />
              <span>Debug Console</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Sezione Override Ruolo */}
            <div className="space-y-2">
              <h3 className="font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <ShieldAlert className="h-3.5 w-3.5" />
                Override Ruolo Utente
              </h3>
              <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 space-y-2">
                <p className="text-[10px] text-zinc-500">
                  Ruolo DB corrente: <span className="text-zinc-300 font-semibold">{profile?.role ?? 'Non connesso'}</span>
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {roles.map((r) => (
                    <button
                      key={r.value || 'null'}
                      onClick={() => setOverrideRole(r.value)}
                      className={cn(
                        'w-full text-left px-2 py-1.5 rounded transition-colors text-[11px]',
                        overrideRole === r.value
                          ? 'bg-primary text-white font-semibold'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sezione Registro Log */}
            <div className="flex flex-col flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                  Logs di Sistema
                </h3>
                {logs.length > 0 && (
                  <button
                    onClick={clearLogs}
                    className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Pulisci
                  </button>
                )}
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 h-64 overflow-y-auto space-y-1.5 scrollbar-thin">
                {logs.length === 0 ? (
                  <p className="text-zinc-600 text-center py-10 italic">Nessun log registrato.</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="leading-relaxed border-b border-zinc-800/50 pb-1 last:border-0">
                      <span className="text-zinc-600">[{log.timestamp}]</span>{' '}
                      <span
                        className={cn(
                          log.type === 'error' && 'text-red-400',
                          log.type === 'warn' && 'text-yellow-500',
                          log.type === 'success' && 'text-green-400',
                          log.type === 'info' && 'text-blue-400'
                        )}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 text-[10px] text-zinc-600 text-center">
            Anima Developer Console — v1.0
          </div>
        </div>
      )}
    </>
  )
}
