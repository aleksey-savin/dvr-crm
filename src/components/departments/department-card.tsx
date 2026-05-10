import type { CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import { roleLabels } from '@/utils/roleLabels'
import { Link } from '@tanstack/react-router'
import {
  Building2Icon,
  EditIcon,
  EyeIcon,
  Plus,
  Trash2Icon,
  UsersIcon,
} from 'lucide-react'
import type { DepartmentNode } from '@/types'
import { formatRuCount, getInitials } from './text-utils'

export function DepartmentCard({ node }: { node: DepartmentNode }) {
  const accentColor = node.accentColor?.trim()
  const head = node.head
  const style: CSSProperties | undefined = accentColor
    ? { borderTopColor: accentColor }
    : undefined

  return (
    <div className="department-node-card">
      <div
        className="flex h-46 w-72 flex-col gap-3 rounded-lg border border-t-4 bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md"
        style={style}
      >
        <div className="flex items-start justify-between gap-2">
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
          <div className="flex shrink-0 items-center justify-end gap-0.5">
            <Button asChild variant="ghost" size="icon-xs">
              <Link
                to="/my-company/$id/view"
                params={{ id: node.id }}
                aria-label={`Открыть ${node.name}`}
                title="Открыть"
              >
                <EyeIcon />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon-xs">
              <Link
                to="/my-company/$id/update"
                params={{ id: node.id }}
                aria-label={`Изменить ${node.name}`}
                title="Изменить"
              >
                <EditIcon />
              </Link>
            </Button>
            <Button asChild variant="destructiveGhost" size="icon-xs">
              <Link
                to="/my-company/$id/delete"
                params={{ id: node.id }}
                aria-label={`Удалить ${node.name}`}
                title="Удалить"
              >
                <Trash2Icon />
              </Link>
            </Button>
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
                Руководитель · {roleLabels[head.role] ?? head.role}
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
        >
          <Plus />
        </Link>
      </Button>
    </div>
  )
}
