import { create } from 'zustand'
import { UserRole } from '@/types'

interface AppState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  patientLargeFont: boolean
  setPatientLargeFont: (enabled: boolean) => void
  patientHighContrast: boolean
  setPatientHighContrast: (enabled: boolean) => void
  patientMotionReduced: boolean
  setPatientMotionReduced: (enabled: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  patientLargeFont: false,
  setPatientLargeFont: (enabled) => set({ patientLargeFont: enabled }),
  patientHighContrast: false,
  setPatientHighContrast: (enabled) => set({ patientHighContrast: enabled }),
  patientMotionReduced: false,
  setPatientMotionReduced: (enabled) => set({ patientMotionReduced: enabled }),
}))
