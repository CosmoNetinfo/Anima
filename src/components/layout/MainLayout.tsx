'use client'

import React, { useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Topbar } from './Topbar'
import { useUser } from '@/lib/hooks/useUser'
import { useAppStore } from '@/lib/stores/appStore'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { SOSButton } from '@/components/ui/SOSButton'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { profile, loading } = useUser()
  const {
    sidebarOpen,
    setSidebarOpen,
    patientLargeFont,
    setPatientLargeFont,
    patientHighContrast,
    setPatientHighContrast,
    patientMotionReduced,
    setPatientMotionReduced,
  } = useAppStore()

  // Sincronizza preferenze accessibilità con il body
  useEffect(() => {
    if (!profile) return

    const isLargeFont = profile.large_font_mode ?? false
    const isHighContrast = profile.high_contrast_mode ?? false
    const isMotionReduced = profile.motion_reduced ?? false

    setPatientLargeFont(isLargeFont)
    setPatientHighContrast(isHighContrast)
    setPatientMotionReduced(isMotionReduced)

    // Applica le classi al body
    document.body.classList.toggle('large-font-mode', isLargeFont)
    document.body.classList.toggle('high-contrast-mode', isHighContrast)
    document.body.classList.toggle('motion-reduced', isMotionReduced)
  }, [
    profile?.id,
    profile?.large_font_mode,
    profile?.high_contrast_mode,
    profile?.motion_reduced,
    setPatientLargeFont,
    setPatientHighContrast,
    setPatientMotionReduced,
  ])


  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const isPatientLayout = profile?.role === 'patient' || patientLargeFont

  return (
    <div className={cn('flex h-screen overflow-hidden bg-background')}>
      {/* Sidebar Desktop */}
      <div className="hidden lg:block shrink-0">
        <Sidebar className="h-full" />
      </div>

      {/* Sidebar Drawer Mobile (usando Shadcn Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[220px] bg-sidebar border-r border-sidebar-border">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* Bottom Navigation Mobile */}
        <BottomNav onMenuClick={() => setSidebarOpen(true)} />
      </div>
      <SOSButton />
    </div>
  )
}
