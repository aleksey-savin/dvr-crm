import type { ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { ArrowUpDown, EyeIcon, EditIcon, Trash2Icon, ExternalLinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TenderRow, TenderStatus } from '@/types'

const STATUS_LABELS: Record<TenderStatus, string> = {
  new: 'Новый',
  evaluation: 'Оценка',
  approval: 'Согласование',
  preparation: 'Подготовка',
  submitted: 'Подан',
  won: 'Выигран',
  lost: 'Проигран',
  rejected: 'Отклонён',
  archived: 'Архив',
}

const STATUS_VARIANTS: Record<TenderStatus, 'secondary' | 'warning' | 'default' | 'success' | 'destructive'> = {
  new: 'secondary',
  evaluation: 'warning',
  approval: 'warning',
  preparation: 'default',
  submitted: 'default',
  won: 'success',
  lost: 'destructive',
  rejected: 'destructive',
  archived: 'secondary',
}

export const columns: ColumnDef<TenderRow>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Название <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const { title, url } = row.original
      return (
        <div className="flex items-center gap-1.5">
          <span>{title}</span>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <ExternalLinkIcon className="size-3.5 text-muted-foreground hover:text-foreground" />
            </a>
          )}
        </div>
      )
    },
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
    accessorKey: 'platform',
    header: 'Площадка',
    cell: ({ row }) => row.original.platform ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'departmentName',
    header: 'Подразделение',
    cell: ({ row }) => row.original.departmentName ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'industryName',
    header: 'Отрасль',
    cell: ({ row }) => row.original.industryName ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Сумма <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const v = row.original.amount
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
    accessorKey: 'deadline',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Дедлайн <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const d = row.original.deadline
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
    accessorKey: 'approverUserName',
    header: 'Согласующий',
    cell: ({ row }) => row.original.approverUserName ?? <span className="text-muted-foreground">—</span>,
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
          <Link to="/tenders/$id/view" params={{ id: row.original.id }}>
            <EyeIcon className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/tenders/$id/update" params={{ id: row.original.id }}>
            <EditIcon className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="destructiveGhost" size="icon-sm">
          <Link to="/tenders/$id/delete" params={{ id: row.original.id }}>
            <Trash2Icon className="size-4" />
          </Link>
        </Button>
      </div>
    ),
  },
]
