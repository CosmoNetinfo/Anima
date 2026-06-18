import React from 'react'
import { cn } from '@/lib/utils'

export type StatusBadgeVariant =
  | 'pending'
  | 'given'
  | 'skipped'
  | 'refused'
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'alert'
  | 'ok'

interface StatusBadgeProps {
  variant: StatusBadgeVariant
  className?: string
}

const statusConfig: Record<StatusBadgeVariant, { label: string; color: string; bg: string }> = {
  pending: { label: 'In attesa', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  given: { label: 'Somministrato', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' },
  skipped: { label: 'Saltato', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)' },
  refused: { label: 'Rifiutato', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  scheduled: { label: 'Pianificato', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.12)' },
  completed: { label: 'Completato', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' },
  cancelled: { label: 'Annullato', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  alert: { label: 'Attenzione', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  ok: { label: 'Regolare', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' },
}

export function StatusBadge({ variant, className }: StatusBadgeProps) {
  const config = statusConfig[variant] || statusConfig.pending

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-semibold text-[11px] px-2 py-0.5 rounded-[20px] whitespace-nowrap',
        className
      )}
      style={{
        color: config.color,
        backgroundColor: config.bg,
      }}
    >
      {config.label}
    </span>
  )
}
