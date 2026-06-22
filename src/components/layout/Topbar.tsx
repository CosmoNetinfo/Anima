'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { Bell, Menu, Activity, ShieldAlert, MessageSquare, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getNotifications, markAsRead, NotificationItem } from '@/app/actions/notifications'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

interface TopbarProps {
  onMenuClick: () => void
  className?: string
}

export function Topbar({ onMenuClick, className }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useUser()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Recupera le notifiche
  const fetchNotifications = useCallback(async () => {
    const res = await getNotifications()
    if (res.data) {
      setNotifications(res.data)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications()
    }, 0)
    // Poll per nuove notifiche ogni 30 secondi
    const interval = setInterval(fetchNotifications, 30000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [fetchNotifications])

  // Chiude il dropdown al click all'esterno
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mappa dei titoli in base alla rotta
  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Home'
    if (pathname.startsWith('/patients')) return 'Fascicolo Paziente'
    if (pathname.startsWith('/mood')) return 'Mood Tracker'
    if (pathname.startsWith('/memoriae')) return 'Bacheca Ricordi'
    if (pathname.startsWith('/messages')) return 'Messaggi'
    if (pathname.startsWith('/calendar')) return 'Calendario'
    if (pathname.startsWith('/admin')) return 'Amministrazione'
    if (pathname.startsWith('/settings')) return 'Impostazioni'
    return 'Anima'
  }

  const handleNotificationClick = async (notif: NotificationItem) => {
    setIsOpen(false)
    await markAsRead(notif.id)
    // Rimuove o aggiorna lo stato locale
    setNotifications(prev => prev.filter(n => n.id !== notif.id))
    router.push(notif.link)
  }

  const handleMarkAllAsRead = async () => {
    await Promise.all(notifications.map(n => markAsRead(n.id)))
    setNotifications([])
  }

  const hasUnread = notifications.length > 0

  return (
    <header
      className={cn(
        'h-14 border-b border-border bg-background flex items-center justify-between px-4 sticky top-0 z-30 lg:h-16 lg:px-6',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Apri menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-semibold text-lg lg:text-xl tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifiche */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted relative transition-colors",
              isOpen && "bg-muted text-foreground"
            )}
            aria-label="Notifiche"
          >
            <Bell className="h-5 w-5" />
            {hasUnread && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-danger border border-background animate-pulse" />
            )}
          </button>

          {/* Pannello Dropdown Notifiche */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[480px]">
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                <span className="font-bold text-sm text-foreground">Notifiche ({notifications.length})</span>
                {hasUnread && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Segna lette
                  </button>
                )}
              </div>

              <div className="overflow-y-auto divide-y divide-border flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <Bell className="h-8 w-8 text-muted-foreground/45" />
                    <span>Nessuna nuova notifica</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className="w-full text-left p-4 hover:bg-muted/40 transition-colors flex items-start gap-3 border-none outline-none focus:bg-muted/40"
                    >
                      <div className={cn(
                        "p-2 rounded-xl shrink-0 mt-0.5",
                        notif.type === 'vital_alert' ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'
                      )}>
                        {notif.type === 'vital_alert' ? (
                          <ShieldAlert className="h-4 w-4" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground leading-snug truncate">
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                          {notif.description}
                        </p>
                        <p className="text-[9px] text-muted-foreground/60 mt-1.5 font-medium">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: it })}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info utente desktop */}
        {profile && (
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-border">
            <span className="text-sm font-medium">{profile.full_name}</span>
          </div>
        )}
      </div>
    </header>
  )
}
