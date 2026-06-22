import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
  isConsoleOpen: boolean
  toggleConsole: () => void
  setConsoleOpen: (open: boolean) => void
}

export const useDebugStore = create<DebugState>()(
  persist(
    (set) => ({
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
      isConsoleOpen: false,
      toggleConsole: () => set((state) => ({ isConsoleOpen: !state.isConsoleOpen })),
      setConsoleOpen: (open) => set({ isConsoleOpen: open }),
    }),
    {
      name: 'anima-debug-store', // chiave localStorage
      // Persiste SOLO overrideRole e isConsoleOpen, NON i logs (troppo rumorosi)
      partialize: (state) => ({
        overrideRole: state.overrideRole,
        isConsoleOpen: state.isConsoleOpen,
      }),
    }
  )
)


