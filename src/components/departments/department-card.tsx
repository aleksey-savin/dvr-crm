import type { CSSProperties } from 'react'
import { Link } from '@tanstack/react-router'
import { Building2Icon, Plus, UsersIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { DepartmentNode } from '@/types'
import { formatRuCount, getInitials } from './text-utils'

export function DepartmentCard({
  node,
  onOpen,
}: {
  node: DepartmentNode
  onOpen: (node: DepartmentNode) => void
}) {
  const accentColor = node.accentColor?.trim()
  const head = node.head
  const style: CSSProperties | undefined = accentColor
    ? { borderTopColor: accentColor }
    : undefined

  return (
    <div className="department-node-card">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(node)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onOpen(node)
          }
        }}
        className="flex h-46 w-72 flex-col gap-3 rounded-lg border border-t-4 bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md"
        style={style}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <Building2Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold leading-5">
              {node.name}
            </h3>
          </div>
        </div>

        {head ? (
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {head.image ? (
                <img
                  src={head.image}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                getInitials(head.name)
              )}
            </span>
            <div className="min-w-0">
              <div className="truncate text-xs font-medium">{head.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">
                Руководитель{head.position ? ` · ${head.position}` : ''}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Руководитель не указан
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-2">
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <UsersIcon className="size-3.5 shrink-0" />
            <span className="truncate">
              {formatRuCount(
                node.users.length,
                'сотрудник',
                'сотрудника',
                'сотрудников',
              )}
            </span>
          </div>
        </div>
      </div>

      <Button
        asChild
        variant="outline"
        size="icon-sm"
        className="department-add-child rounded-full bg-background shadow-sm"
      >
        <Link
          to="/my-company/new"
          search={{ parentId: node.id, tab: 'structure' }}
          aria-label={`Создать дочернее подразделение для ${node.name}`}
          title="Создать дочернее подразделение"
          onClick={(event) => event.stopPropagation()}
        >
          <Plus />
        </Link>
      </Button>
    </div>
  )
}
