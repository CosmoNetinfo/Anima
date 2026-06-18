'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { Bell, Menu, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopbarProps {
  onMenuClick: () => void
  className?: string
}

export function Topbar({ onMenuClick, className }: TopbarProps) {
  const pathname = usePathname()
  const { profile } = useUser()

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
        <button
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted relative"
          aria-label="Notifiche"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" />
        </button>

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
