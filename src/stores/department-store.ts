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
        // Auto-select the only department when the user has access to exactly one
        if (departments.length === 1) {
          const dept = departments[0]
          set({
            departments,
            selectedDepartmentId: dept.id,
            selectedAccentColor: dept.accentColor ?? null,
          })
          return
        }

        const { selectedDepartmentId } = get()
        const isStillAccessible = selectedDepartmentId
          ? departments.some((d) => d.id === selectedDepartmentId)
          : true
        const nextSelectedId = isStillAccessible ? selectedDepartmentId : null
        const selectedAccentColor =
          departments.find((d) => d.id === nextSelectedId)?.accentColor ?? null
        set({ departments, selectedDepartmentId: nextSelectedId, selectedAccentColor })
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
