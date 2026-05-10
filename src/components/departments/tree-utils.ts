import type { DepartmentNode, DepartmentRow } from './types'

export function buildDepartmentTree(departments: DepartmentRow[]) {
  const nodesById = new Map<string, DepartmentNode>()

  for (const department of departments) {
    nodesById.set(department.id, {
      ...department,
      children: [],
    })
  }

  const roots: DepartmentNode[] = []

  for (const node of nodesById.values()) {
    const parent = node.parentId ? nodesById.get(node.parentId) : undefined

    if (parent && parent.id !== node.id) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const reachableIds = new Set<string>()
  for (const root of roots) {
    markReachableDepartment(root, reachableIds)
  }

  for (const node of nodesById.values()) {
    if (!reachableIds.has(node.id)) {
      roots.push(node)
      markReachableDepartment(node, reachableIds)
    }
  }

  sortDepartmentNodes(roots)
  return roots
}

function markReachableDepartment(
  node: DepartmentNode,
  reachableIds: Set<string>,
  ancestorIds = new Set<string>(),
) {
  if (ancestorIds.has(node.id) || reachableIds.has(node.id)) return

  reachableIds.add(node.id)
  const nextAncestorIds = new Set(ancestorIds)
  nextAncestorIds.add(node.id)

  for (const child of node.children) {
    markReachableDepartment(child, reachableIds, nextAncestorIds)
  }
}

function sortDepartmentNodes(
  nodes: DepartmentNode[],
  sortedIds = new Set<string>(),
) {
  nodes.sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  for (const node of nodes) {
    if (sortedIds.has(node.id)) continue
    sortedIds.add(node.id)
    sortDepartmentNodes(node.children, sortedIds)
  }
}
