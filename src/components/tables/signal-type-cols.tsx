import type { ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { EditIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { SignalTypeRow } from '@/types'

export const columns: ColumnDef<SignalTypeRow>[] = [
  {
    accessorKey: 'name',
    header: 'Наименование',
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.name}</Badge>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Создан',
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString('ru-RU')}
      </span>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/signal-types/$id/update" params={{ id: row.original.id }}>
            <EditIcon className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="destructiveGhost" size="icon-sm">
          <Link to="/signal-types/$id/delete" params={{ id: row.original.id }}>
            <Trash2Icon className="size-4" />
          </Link>
        </Button>
      </div>
    ),
  },
]
