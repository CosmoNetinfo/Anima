'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { RoleBadge } from '@/components/ui/RoleBadge'
import {
  LayoutDashboard,
  Users,
  Smile,
  Heart,
  MessageSquare,
  Calendar,
  ShieldAlert,
  Settings,
  LogOut,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
  onClose?: () => void
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { profile, isStaff, isAdmin, isPatient } = useUser()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Definizione dei link di navigazione in base al ruolo
  const menuItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      href: '/patients',
      label: 'Pazienti',
      icon: Users,
      show: isStaff() || isAdmin(),
    },
    {
      href: '/mood',
      label: 'Mood Tracker',
      icon: Smile,
      show: isPatient() || !isStaff(), // Patient o Caregiver
    },
    {
      href: '/memoriae',
      label: 'Memoriae',
      icon: Heart,
      show: true,
    },
    {
      href: '/messages',
      label: 'Messaggi',
      icon: MessageSquare,
      show: true,
    },
    {
      href: '/calendar',
      label: 'Calendario',
      icon: Calendar,
      show: true,
    },
    {
      href: '/admin',
      label: 'Amministrazione',
      icon: ShieldAlert,
      show: isAdmin(),
    },
    {
      href: '/settings',
      label: 'Impostazioni',
      icon: Settings,
      show: true,
    },
  ]

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-sidebar border-r border-sidebar-border w-[220px] text-sidebar-foreground',
        className
      )}
    >
      {/* Header Logo */}
      <div className="flex items-center gap-2 px-6 h-16 border-b border-sidebar-border select-none">
        <Activity className="h-6 w-6 text-primary" />
        <span className="font-bold text-xl tracking-wide text-primary">Anima</span>
      </div>

      {/* Profilo Utente */}
      {profile && (
        <div className="p-4 border-b border-sidebar-border bg-sidebar-accent/30">
          <p className="font-semibold text-sm truncate">{profile.full_name}</p>
          <div className="mt-1">
            <RoleBadge role={profile.role} />
          </div>
        </div>
      )}

      {/* Voci di Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems
          .filter((item) => item.show)
          .map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground'
                  )}
                />
                {item.label}
              </Link>
            )
          })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 w-full transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Esci
        </button>
      </div>
    </aside>
  )
}
