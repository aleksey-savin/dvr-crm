import { useState } from 'react'
import { DepartmentCard } from './department-card'
import { DepartmentMembersSheet } from './department-members-sheet'
import { buildDepartmentTree } from './tree-utils'
import type { DepartmentNode, DepartmentRow, EmployeeRow } from '@/types'

export function DepartmentTree({
  departments,
  users,
}: {
  departments: DepartmentRow[]
  users: EmployeeRow[]
}) {
  const roots = buildDepartmentTree(departments)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null)
  const selectedDepartment = selectedDepartmentId
    ? findDepartmentNode(roots, selectedDepartmentId)
    : null

  return (
    <>
      <div className="department-tree rounded-lg border bg-muted/30 md:p-8 ">
        <ul className="department-tree-root">
          {roots.map((node) => (
            <DepartmentTreeItem
              key={node.id}
              node={node}
              onOpen={(item) => setSelectedDepartmentId(item.id)}
            />
          ))}
        </ul>
      </div>
      <DepartmentMembersSheet
        department={selectedDepartment}
        departments={departments}
        users={users}
        open={!!selectedDepartment}
        onOpenChange={(open) => {
          if (!open) setSelectedDepartmentId(null)
        }}
      />
    </>
  )
}

function findDepartmentNode(
  nodes: DepartmentNode[],
  id: string,
): DepartmentNode | null {
  for (const node of nodes) {
    if (node.id === id) return node

    const child = findDepartmentNode(node.children, id)
    if (child) return child
  }

  return null
}

function DepartmentTreeItem({
  node,
  onOpen,
  ancestorIds = [],
}: {
  node: DepartmentNode
  onOpen: (node: DepartmentNode) => void
  ancestorIds?: string[]
}) {
  const nextAncestorIds = [...ancestorIds, node.id]
  const children = node.children.filter(
    (child) => !nextAncestorIds.includes(child.id),
  )

  return (
    <li>
      <DepartmentCard node={node} onOpen={onOpen} />
      {children.length > 0 && (
        <ul>
          {children.map((child) => (
            <DepartmentTreeItem
              key={child.id}
              node={child}
              onOpen={onOpen}
              ancestorIds={nextAncestorIds}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
