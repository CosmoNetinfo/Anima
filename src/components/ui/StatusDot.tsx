import React from 'react'
import { cn } from '@/lib/utils'

export type StatusDotVariant = 'ok' | 'alert' | 'urgente'

interface StatusDotProps {
  status: StatusDotVariant
  className?: string
}

const dotColors: Record<StatusDotVariant, string> = {
  ok: '#22C55E',       // Green
  alert: '#F59E0B',    // Amber
  urgente: '#EF4444',  // Red
}

export function StatusDot({ status, className }: StatusDotProps) {
  const color = dotColors[status] || dotColors.ok

  return (
    <span
      className={cn('inline-block w-2.5 h-2.5 rounded-full shrink-0', className)}
      style={{ backgroundColor: color }}
      title={status === 'ok' ? 'Regolare' : status === 'alert' ? 'Attenzione' : 'Urgente'}
    />
  )
}
