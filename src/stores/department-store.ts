import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DepartmentOption } from '@/types'

interface DepartmentStore {
  departments: DepartmentOption[]
  selectedDepartmentId: string | null
  selectedAccentColor: string | null
  setDepartments: (departments: DepartmentOption[]) => void
  setSelectedDepartmentId: (id: string | null) => void
}

export const useDepartmentStore = create<DepartmentStore>()(
  persist(
    (set, get) => ({
      departments: [],
      selectedDepartmentId: null,
      selectedAccentColor: null,

      setDepartments: (departments) => {
        const { selectedDepartmentId } = get()
        const selectedAccentColor =
          departments.find((d) => d.id === selectedDepartmentId)?.accentColor ??
          null
        set({ departments, selectedAccentColor })
      },

      setSelectedDepartmentId: (id) => {
        const { departments } = get()
        const selectedAccentColor =
          departments.find((d) => d.id === id)?.accentColor ?? null
        set({ selectedDepartmentId: id, selectedAccentColor })
      },
    }),
    {
      name: 'dvr-department-store',
      // Only persist the selected ID — departments come from the server,
      // selectedAccentColor is derived and recomputed in setDepartments.
      partialize: (state) => ({
        selectedDepartmentId: state.selectedDepartmentId,
      }),
    },
  ),
)
