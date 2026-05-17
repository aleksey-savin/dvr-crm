import type { ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { EditIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TargetActionTypeRow } from '@/types'

export const columns: ColumnDef<TargetActionTypeRow>[] = [
  {
    accessorKey: 'name',
    header: 'Название',
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => (
      <code className="text-xs text-muted-foreground">{row.original.slug}</code>
    ),
  },
  {
    accessorKey: 'isSystem',
    header: 'Тип',
    cell: ({ row }) =>
      row.original.isSystem ? (
        <Badge variant="secondary">Системный</Badge>
      ) : (
        <Badge variant="outline">Пользовательский</Badge>
      ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button asChild variant="ghost" size="icon-sm">
          <Link
            to="/target-action-types/$id/update"
            params={{ id: row.original.id }}
          >
            <EditIcon className="size-4" />
          </Link>
        </Button>
        {!row.original.isSystem && (
          <Button asChild variant="destructiveGhost" size="icon-sm">
            <Link
              to="/target-action-types/$id/delete"
              params={{ id: row.original.id }}
            >
              <Trash2Icon className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    ),
  },
]
