'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useDebugStore } from '@/lib/stores/debugStore'
import { useUser } from '@/lib/hooks/useUser'
import { UserRole } from '@/types'
import { Bug, X, Trash2, ShieldAlert, Search, ChevronDown, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

type LogFilter = 'all' | 'error' | 'warn' | 'info' | 'success'

export function DebugConsole() {
  const { logs, addLog, clearLogs, overrideRole, setOverrideRole, isConsoleOpen, setConsoleOpen } = useDebugStore()
  const isOpen = isConsoleOpen
  const setIsOpen = setConsoleOpen
  const [filter, setFilter] = useState<LogFilter>('all')
  const [search, setSearch] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const { profile } = useUser()
  const logsEndRef = useRef<HTMLDivElement>(null)
  const logsContainerRef = useRef<HTMLDivElement>(null)

  // Intercetta tutti gli errori globali e le chiamate console
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleGlobalError = (event: ErrorEvent) => {
      addLog(`[Error] ${event.message} (${event.filename?.split('/').pop() ?? ''}:${event.lineno})`, 'error')
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || String(event.reason) || 'Unhandled Promise Rejection'
      addLog(`[Unhandled Promise] ${reason}`, 'error')
    }

    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Intercettazione Console
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn
    const originalConsoleInfo = console.info
    const originalConsoleLog = console.log
    const originalConsoleDebug = console.debug

    const serialize = (arg: unknown): string => {
      if (arg instanceof Error) return `${arg.name}: ${arg.message}`
      if (typeof arg === 'object' && arg !== null) {
        try { return JSON.stringify(arg, null, 0) } catch { return String(arg) }
      }
      return String(arg)
    }

    console.error = (...args: unknown[]) => {
      addLog(`[Console Error] ${args.map(serialize).join(' ')}`, 'error')
      originalConsoleError.apply(console, args)
    }

    console.warn = (...args: unknown[]) => {
      addLog(`[Console Warn] ${args.map(serialize).join(' ')}`, 'warn')
      originalConsoleWarn.apply(console, args)
    }

    console.info = (...args: unknown[]) => {
      addLog(`[Console Info] ${args.map(serialize).join(' ')}`, 'info')
      originalConsoleInfo.apply(console, args)
    }

    console.log = (...args: unknown[]) => {
      addLog(`[Console Log] ${args.map(serialize).join(' ')}`, 'info')
      originalConsoleLog.apply(console, args)
    }

    console.debug = (...args: unknown[]) => {
      addLog(`[Console Debug] ${args.map(serialize).join(' ')}`, 'info')
      originalConsoleDebug.apply(console, args)
    }

    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
      console.info = originalConsoleInfo
      console.log = originalConsoleLog
      console.debug = originalConsoleDebug
    }
  }, [addLog])

  // Intercetta tutte le chiamate fetch (richieste DB/API)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalFetch = window.fetch
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
      const shortUrl = url.length > 60 ? '...' + url.slice(-60) : url
      const start = performance.now()
      try {
        const response = await originalFetch(...args)
        const elapsed = Math.round(performance.now() - start)
        const type = response.ok ? 'success' : 'error'
        const msg = response.ok
          ? `[Fetch OK ${response.status}] ${shortUrl} (${elapsed}ms)`
          : `[Fetch ERR ${response.status}] ${shortUrl} (${elapsed}ms)`
        addLog(msg, type)
        if (elapsed > 3000) addLog(`[Fetch SLOW] ${shortUrl} ha impiegato ${elapsed}ms`, 'warn')
        return response
      } catch (err: unknown) {
        const elapsed = Math.round(performance.now() - start)
        const msg = err instanceof Error ? err.message : String(err)
        addLog(`[Fetch FAILED] ${shortUrl} — ${msg} (${elapsed}ms)`, 'error')
        throw err
      }
    }

    // Intercetta i click su pulsanti e link
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const btn = target.closest('button, a, [role="button"]') as HTMLElement | null
      if (btn) {
        const label = btn.getAttribute('aria-label')
          || btn.textContent?.trim().slice(0, 40)
          || btn.tagName.toLowerCase()
        addLog(`[Click] "${label}"`, 'info')
      }
    }

    // Intercetta navigazione (Next.js router push)
    const handlePopstate = () => {
      addLog(`[Nav] ${window.location.pathname}`, 'info')
    }

    document.addEventListener('click', handleClick, true)
    window.addEventListener('popstate', handlePopstate)

    return () => {
      window.fetch = originalFetch
      document.removeEventListener('click', handleClick, true)
      window.removeEventListener('popstate', handlePopstate)
    }
  }, [addLog])

  // Auto-scroll quando arrivano nuovi log
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  // Rileva quando l'utente scrolla manualmente verso l'alto per disattivare l'autoscroll
  const handleLogsScroll = () => {
    const el = logsContainerRef.current
    if (!el) return
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30
    setAutoScroll(isAtBottom)
  }

  const handleSetOverrideRole = (role: UserRole | null) => {
    setOverrideRole(role)
    if (typeof document !== 'undefined') {
      if (role) {
        document.cookie = `anima-override-role=${role}; path=/; max-age=31536000`
      } else {
        document.cookie = `anima-override-role=; path=/; max-age=0`
        document.cookie = `anima-override-patient-id=; path=/; max-age=0`
      }
      // Ricarica la pagina per sincronizzare server actions e layout
      window.location.reload()
    }
  }

  // Solo in ambiente di sviluppo
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const roles: { value: UserRole | null; label: string }[] = [
    { value: null, label: `Usa Ruolo Reale (${profile?.role ?? '?'})` },
    { value: 'patient', label: '🧓 Paziente (Memora)' },
    { value: 'caregiver', label: '👨‍👩‍👧 Caregiver' },
    { value: 'nurse', label: '🩺 Infermiere (CareLink)' },
    { value: 'doctor', label: '👨‍⚕️ Medico' },
    { value: 'admin', label: '🔐 Admin' },
    { value: 'super_admin', label: '⚡ Super Admin' },
  ]

  // Contatori per badge
  const errorCount = logs.filter(l => l.type === 'error').length
  const warnCount = logs.filter(l => l.type === 'warn').length

  // Log filtrati
  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.type === filter
    const matchesSearch = !search || log.message.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const filterTabs: { key: LogFilter; label: string; color: string }[] = [
    { key: 'all', label: `All (${logs.length})`, color: 'text-zinc-400' },
    { key: 'error', label: `Err (${logs.filter(l => l.type === 'error').length})`, color: 'text-red-400' },
    { key: 'warn', label: `Warn (${logs.filter(l => l.type === 'warn').length})`, color: 'text-yellow-500' },
    { key: 'info', label: `Info (${logs.filter(l => l.type === 'info').length})`, color: 'text-blue-400' },
    { key: 'success', label: `OK (${logs.filter(l => l.type === 'success').length})`, color: 'text-green-400' },
  ]

  return (
    <>
      {/* Pannello Console Debug — si apre da sinistra */}
      {isOpen && (

        <div
          data-debug-console
          className="fixed inset-y-0 left-0 w-[360px] bg-zinc-950 text-zinc-100 shadow-2xl border-r border-zinc-800 z-[9999] flex flex-col font-mono"
        >
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-destructive" />
              <span className="font-bold text-white tracking-wide">Debug Console</span>
              {errorCount > 0 && (
                <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-red-500/30">
                  {errorCount} ERR
                </span>
              )}
              {warnCount > 0 && (
                <span className="bg-yellow-500/20 text-yellow-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-yellow-500/30">
                  {warnCount} WARN
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Banner override attivo — sempre visibile se override è attivo */}
            {overrideRole && (
              <div className="bg-yellow-500/15 border-b border-yellow-500/40 px-3 py-2 flex items-center gap-2 shrink-0">
                <ShieldAlert className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                <p className="text-[10px] text-yellow-300 flex-1 font-semibold">
                  Override attivo: <span className="text-yellow-100 font-bold uppercase">{overrideRole}</span>
                  <span className="ml-1 text-yellow-500/70 font-normal">(persiste tra le pagine)</span>
                </p>
                <button
                  onClick={() => handleSetOverrideRole(null)}
                  className="text-[9px] bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30 transition-colors font-bold shrink-0"
                >
                  ✕ Reset
                </button>
              </div>
            )}

            {/* Override Ruolo */}
            <div className="p-3 border-b border-zinc-800 space-y-2 shrink-0">
              <h3 className="font-semibold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider text-[9px]">
                <ShieldAlert className="h-3 w-3" />
                Override Ruolo Utente
              </h3>
              <p className="text-[10px] text-zinc-500">
                DB: <span className="text-zinc-300 font-semibold">{profile?.role ?? 'Non connesso'}</span>
                {overrideRole && <span className="ml-2 text-yellow-400">→ Override: <strong>{overrideRole}</strong></span>}
              </p>
              <div className="grid grid-cols-2 gap-1">
                {roles.map((r) => (
                  <button
                    key={r.value || 'null'}
                    onClick={() => handleSetOverrideRole(r.value)}
                    className={cn(
                      'w-full text-left px-2 py-1 rounded transition-colors text-[10px] truncate',
                      overrideRole === r.value
                        ? 'bg-primary/90 text-white font-bold'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Log section */}
            <div className="flex flex-col flex-1 min-h-0 p-3 gap-2">
              {/* Toolbar */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600" />
                  <input
                    type="text"
                    placeholder="Cerca nei log..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded pl-6 pr-2 py-1 text-[10px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                {logs.length > 0 && (
                  <button
                    onClick={clearLogs}
                    className="text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5 transition-colors shrink-0"
                    title="Pulisci logs"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Filtri per tipo */}
              <div className="flex gap-1 shrink-0 flex-wrap">
                {filterTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={cn(
                      'px-2 py-0.5 rounded text-[9px] font-bold border transition-all',
                      filter === tab.key
                        ? 'bg-zinc-700 border-zinc-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600',
                      tab.color
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Log List */}
              <div
                ref={logsContainerRef}
                onScroll={handleLogsScroll}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg overflow-y-auto min-h-0"
              >
                {filteredLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-600 italic py-10 text-[11px]">
                    <Bug className="h-6 w-6 mb-2 opacity-30" />
                    {logs.length === 0 ? 'Nessun log registrato.' : 'Nessun log corrisponde ai filtri.'}
                  </div>
                ) : (
                  <div className="p-2 space-y-px">
                    {filteredLogs.map((log, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex items-start gap-1.5 py-1 px-1.5 rounded hover:bg-zinc-800/50 transition-colors group',
                        )}
                      >
                        <Circle className={cn(
                          'h-1.5 w-1.5 mt-1.5 shrink-0 fill-current',
                          log.type === 'error' && 'text-red-400',
                          log.type === 'warn' && 'text-yellow-500',
                          log.type === 'success' && 'text-green-400',
                          log.type === 'info' && 'text-blue-400',
                        )} />
                        <div className="flex-1 min-w-0">
                          <span className="text-zinc-600 text-[9px] select-none">{log.timestamp} </span>
                          <span
                            className={cn(
                              'break-all leading-relaxed text-[10px]',
                              log.type === 'error' && 'text-red-400',
                              log.type === 'warn' && 'text-yellow-500',
                              log.type === 'success' && 'text-green-400',
                              log.type === 'info' && 'text-zinc-300',
                            )}
                          >
                            {log.message}
                          </span>
                        </div>
                        {/* Tasto copia — appare al hover */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`[${log.timestamp}] ${log.message}`)
                              .then(() => addLog('[Copiato negli appunti]', 'success'))
                              .catch(() => addLog('[Errore copia]', 'error'))
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200"
                          title="Copia log"
                        >
                          <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>

              {/* Auto-scroll indicator */}
              {!autoScroll && (
                <button
                  onClick={() => {
                    setAutoScroll(true)
                    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="flex items-center gap-1 text-[9px] text-zinc-500 hover:text-zinc-300 transition-colors mx-auto shrink-0"
                >
                  <ChevronDown className="h-3 w-3" />
                  Scorri in fondo (auto-scroll disattivato)
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-zinc-800 bg-zinc-900/50 shrink-0 flex items-center justify-between">
            <span className="text-[9px] text-zinc-600">Anima Dev Console — v2.0</span>
            <span className="text-[9px] text-zinc-600">
              {filteredLogs.length}/{logs.length} log
            </span>
          </div>
        </div>
      )}
    </>
  )
}
