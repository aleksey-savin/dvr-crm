import { create } from 'zustand'

export interface Department {
  id: string
  name: string
}

interface DepartmentStore {
  departments: Department[]
  selectedDepartmentId: string | null // null = all departments
  setDepartments: (departments: Department[]) => void
  setSelectedDepartmentId: (id: string | null) => void
}

export const useDepartmentStore = create<DepartmentStore>((set) => ({
  departments: [],
  selectedDepartmentId: null,
  setDepartments: (departments) => set({ departments }),
  setSelectedDepartmentId: (id) => set({ selectedDepartmentId: id }),
}))
