import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DepartmentOption } from '@/types'

interface DepartmentStore {
  departments: DepartmentOption[]
  selectedDepartmentId: string | null
  selectedAccentColor: string | null
  setDepartments: (departments: DepartmentOption[]) => void
  setSelectedDepartmentId: (id: string) => void
}

/**
 * The top-most department in the accessible list: the first root of the
 * accessible forest (a department with no parent, or whose parent is outside
 * the accessible set). Departments arrive ordered by name, so the first root
 * is the alphabetically-first top-level unit. Used as the default scope.
 */
function findTopDepartmentId(departments: DepartmentOption[]): string | null {
  if (departments.length === 0) return null
  const ids = new Set(departments.map((d) => d.id))
  const roots = departments.filter((d) => !d.parentId || !ids.has(d.parentId))
  return (roots[0] ?? departments[0]).id
}

export const useDepartmentStore = create<DepartmentStore>()(
  persist(
    (set, get) => ({
      departments: [],
      selectedDepartmentId: null,
      selectedAccentColor: null,

      setDepartments: (departments) => {
        // The scope is always a concrete department: keep the persisted
        // selection when it is still accessible, otherwise default to the
        // top-most accessible department.
        const { selectedDepartmentId } = get()
        const persistedStillAccessible =
          selectedDepartmentId != null &&
          departments.some((d) => d.id === selectedDepartmentId)
        const nextSelectedId = persistedStillAccessible
          ? selectedDepartmentId
          : findTopDepartmentId(departments)
        const selectedAccentColor =
          departments.find((d) => d.id === nextSelectedId)?.accentColor ?? null
        set({
          departments,
          selectedDepartmentId: nextSelectedId,
          selectedAccentColor,
        })
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
