import React from 'react'
import { cn } from '@/lib/utils'
import { UserRole } from '@/types'

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

const roleConfig: Record<UserRole, { label: string; color: string; bg: string }> = {
  patient: { label: 'Paziente', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' }, // Warm amber
  caregiver: { label: 'Caregiver', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.12)' }, // Violet
  nurse: { label: 'Infermiere', color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.12)' }, // Clinical sky
  doctor: { label: 'Medico', color: '#0D9488', bg: 'rgba(13, 148, 136, 0.12)' }, // Teal
  admin: { label: 'Admin', color: '#4B5563', bg: 'rgba(75, 85, 99, 0.12)' }, // Gray
  super_admin: { label: 'Super Admin', color: '#111827', bg: 'rgba(17, 24, 39, 0.12)' }, // Dark gray
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.caregiver

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-semibold text-[11px] px-2.5 py-0.5 rounded-[20px] whitespace-nowrap',
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
