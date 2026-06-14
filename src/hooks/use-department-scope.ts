import * as React from 'react'
import { useDepartmentStore } from '@/stores/department-store'
import { collectDepartmentDescendants } from '@/lib/department-tree'

/**
 * Set of department IDs in the current global scope (selected department + all
 * descendants), or null when no scope is selected ("all departments").
 */
export function useScopedDepartmentIds(): Set<string> | null {
  const selectedDepartmentId = useDepartmentStore((s) => s.selectedDepartmentId)
  const departments = useDepartmentStore((s) => s.departments)
  return React.useMemo(() => {
    if (!selectedDepartmentId) return null
    return new Set(
      collectDepartmentDescendants(departments, [selectedDepartmentId]),
    )
  }, [selectedDepartmentId, departments])
}

/**
 * Whether a record belongs to the current scope. No scope → everything passes.
 * Records without a department are visible to everyone.
 */
export function matchesDepartmentScope(
  scopedIds: Set<string> | null,
  departmentId: string | null | undefined,
): boolean {
  if (!scopedIds) return true
  if (departmentId == null) return true
  return scopedIds.has(departmentId)
}
