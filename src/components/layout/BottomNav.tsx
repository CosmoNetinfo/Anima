'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { LayoutDashboard, Heart, MessageSquare, Menu, Smile, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  onMenuClick: () => void
}

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const pathname = usePathname()
  const { isPatient } = useUser()

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around px-2 z-40 lg:hidden safe-bottom">
      <Link
        href="/dashboard"
        className={cn(
          'flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors',
          isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <LayoutDashboard className="h-5 w-5 mb-1" />
        <span>Home</span>
      </Link>

      <Link
        href="/memoriae"
        className={cn(
          'flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors',
          isActive('/memoriae') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Heart className="h-5 w-5 mb-1" />
        <span>Memoriae</span>
      </Link>

      <Link
        href="/messages"
        className={cn(
          'flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors',
          isActive('/messages') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <MessageSquare className="h-5 w-5 mb-1" />
        <span>Chat</span>
      </Link>

      {isPatient() ? (
        <Link
          href="/mood"
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors',
            isActive('/mood') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Smile className="h-5 w-5 mb-1" />
          <span>Mood</span>
        </Link>
      ) : (
        <Link
          href="/settings"
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors',
            isActive('/settings') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Settings className="h-5 w-5 mb-1" />
          <span>Impostazioni</span>
        </Link>
      )}

      <button
        onClick={onMenuClick}
        className="flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Menu className="h-5 w-5 mb-1" />
        <span>Menu</span>
      </button>
    </nav>
  )
}
