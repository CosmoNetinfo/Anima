'use client'

import React from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { DebugConsole } from '@/components/debug/DebugConsole'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MainLayout>
      {children}
      <DebugConsole />
    </MainLayout>
  )
}
