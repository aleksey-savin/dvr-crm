import type { ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { ArrowUpDown, EyeIcon, EditIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { LeadRow, LeadStatus } from '@/types'

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  converted: 'Конвертирован',
  rejected: 'Отклонён',
}

const STATUS_VARIANTS: Record<LeadStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  new: 'secondary',
  in_progress: 'warning',
  converted: 'success',
  rejected: 'destructive',
}

export const columns: ColumnDef<LeadRow>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Название <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'companyName',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Компания <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => row.original.companyName ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'industryName',
    header: 'Отрасль',
    cell: ({ row }) => row.original.industryName ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'source',
    header: 'Источник',
    cell: ({ row }) => row.original.source ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'budget',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Бюджет <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const v = row.original.budget
      if (!v) return <span className="text-muted-foreground">—</span>
      return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(Number(v))
    },
  },
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ row }) => {
      const s = row.original.status
      return <Badge variant={STATUS_VARIANTS[s]}>{STATUS_LABELS[s]}</Badge>
    },
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Срок <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const d = row.original.dueDate
      if (!d) return <span className="text-muted-foreground">—</span>
      return new Date(d).toLocaleDateString('ru-RU')
    },
  },
  {
    accessorKey: 'responsibleUserName',
    header: 'Ответственный',
    cell: ({ row }) => row.original.responsibleUserName ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Создан <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('ru-RU'),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/leads/$id/view" params={{ id: row.original.id }}>
            <EyeIcon className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/leads/$id/update" params={{ id: row.original.id }}>
            <EditIcon className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="destructiveGhost" size="icon-sm">
          <Link to="/leads/$id/delete" params={{ id: row.original.id }}>
            <Trash2Icon className="size-4" />
          </Link>
        </Button>
      </div>
    ),
  },
]
