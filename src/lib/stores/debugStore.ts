import { create } from 'zustand'
import { UserRole } from '@/types'

interface DebugLog {
  timestamp: string
  message: string
  type: 'info' | 'warn' | 'error' | 'success'
}

interface DebugState {
  logs: DebugLog[]
  addLog: (message: string, type?: 'info' | 'warn' | 'error' | 'success') => void
  clearLogs: () => void
  overrideRole: UserRole | null
  setOverrideRole: (role: UserRole | null) => void
}

export const useDebugStore = create<DebugState>((set) => ({
  logs: [],
  addLog: (message, type = 'info') =>
    set((state) => ({
      logs: [
        ...state.logs.slice(-99),
        {
          timestamp: new Date().toLocaleTimeString(),
          message,
          type,
        },
      ],
    })),
  clearLogs: () => set({ logs: [] }),
  overrideRole: null,
  setOverrideRole: (role) => set({ overrideRole: role }),
}))
