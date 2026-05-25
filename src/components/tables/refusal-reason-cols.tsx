import type { ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { EditIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { RefusalReasonEntity, RefusalReasonRow } from '@/types'

const ENTITY_LABELS: Record<RefusalReasonEntity, string> = {
  lead: 'Лиды',
  tender: 'Тендеры',
  signal: 'Сигналы',
}

export const columns: ColumnDef<RefusalReasonRow>[] = [
  {
    accessorKey: 'name',
    header: 'Наименование',
    cell: ({ row }) => <Badge variant="secondary">{row.original.name}</Badge>,
  },
  {
    accessorKey: 'entityTypes',
    header: 'Применимо к',
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.entityTypes.map((e) => (
          <Badge key={e} variant="outline">
            {ENTITY_LABELS[e]}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Создана',
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
          <Link
            to="/refusal-reasons/$id/update"
            params={{ id: row.original.id }}
          >
            <EditIcon className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="destructiveGhost" size="icon-sm">
          <Link
            to="/refusal-reasons/$id/delete"
            params={{ id: row.original.id }}
          >
            <Trash2Icon className="size-4" />
          </Link>
        </Button>
      </div>
    ),
  },
]
