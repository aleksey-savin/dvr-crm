/**
 * Collects the given root department IDs plus all of their descendants by
 * walking down the `parentId` tree (breadth-first). Shared by client-side
 * scope filtering and server-side access control.
 */
export function collectDepartmentDescendants(
  departments: Array<{ id: string; parentId?: string | null }>,
  rootIds: string[],
): string[] {
  const result = new Set(rootIds)
  const queue = [...rootIds]
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const d of departments) {
      if (d.parentId === current && !result.has(d.id)) {
        result.add(d.id)
        queue.push(d.id)
      }
    }
  }
  return Array.from(result)
}
