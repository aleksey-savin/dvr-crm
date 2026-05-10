import { DepartmentCard } from './department-card'
import { buildDepartmentTree } from './tree-utils'
import type { DepartmentNode, DepartmentRow } from './types'

export function DepartmentTree({
  departments,
}: {
  departments: DepartmentRow[]
}) {
  const roots = buildDepartmentTree(departments)

  return (
    <div className="department-tree min-h-0 flex-1 overflow-auto rounded-lg border bg-muted/30 md:p-8">
      <ul className="department-tree-root">
        {roots.map((node) => (
          <DepartmentTreeItem key={node.id} node={node} />
        ))}
      </ul>
    </div>
  )
}

function DepartmentTreeItem({
  node,
  ancestorIds = [],
}: {
  node: DepartmentNode
  ancestorIds?: string[]
}) {
  const nextAncestorIds = [...ancestorIds, node.id]
  const children = node.children.filter(
    (child) => !nextAncestorIds.includes(child.id),
  )

  return (
    <li>
      <DepartmentCard node={node} />
      {children.length > 0 && (
        <ul>
          {children.map((child) => (
            <DepartmentTreeItem
              key={child.id}
              node={child}
              ancestorIds={nextAncestorIds}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export type { DepartmentRow }
