import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  description?: string
  trend?: {
    value: string | number
    direction: 'up' | 'down' | 'neutral'
  }
  className?: string
}

export function KpiCard({ title, value, icon, description, trend, className }: KpiCardProps) {
  return (
    <Card className={cn('overflow-hidden border border-border shadow-sm', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-muted text-muted-foreground">{icon}</div>}
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {(description || trend) && (
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {trend && (
                <span
                  className={cn(
                    'font-medium',
                    trend.direction === 'up' && 'text-success',
                    trend.direction === 'down' && 'text-danger',
                    trend.direction === 'neutral' && 'text-muted-foreground'
                  )}
                >
                  {trend.direction === 'up' && '↑'}
                  {trend.direction === 'down' && '↓'}
                  {trend.value}
                </span>
              )}
              {description && <span>{description}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
