import type { ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { ArrowUpDown, EyeIcon, EditIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/ui/star-rating'
import type { SignalRow, SignalStatus, SignalType } from '@/types'

const STATUS_LABELS: Record<SignalStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  converted: 'Конвертирован',
  archived: 'Архив',
}

const STATUS_VARIANTS: Record<SignalStatus, 'secondary' | 'warning' | 'success'> = {
  new: 'secondary',
  in_progress: 'warning',
  converted: 'success',
  archived: 'secondary',
}

const TYPE_LABELS: Record<SignalType, string> = {
  recommendation: 'Рекомендация',
  news: 'Новость',
  direct_contact: 'Прямой контакт',
  other: 'Другое',
}

export const columns: ColumnDef<SignalRow>[] = [
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
    accessorKey: 'signalType',
    header: 'Тип',
    cell: ({ row }) => (
      <Badge variant="outline">{TYPE_LABELS[row.original.signalType]}</Badge>
    ),
  },
  {
    accessorKey: 'rating',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Рейтинг <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <StarRating value={row.original.rating} readonly />
    ),
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
          <Link to="/signals/$id/view" params={{ id: row.original.id }}>
            <EyeIcon className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/signals/$id/update" params={{ id: row.original.id }}>
            <EditIcon className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="destructiveGhost" size="icon-sm">
          <Link to="/signals/$id/delete" params={{ id: row.original.id }}>
            <Trash2Icon className="size-4" />
          </Link>
        </Button>
      </div>
    ),
  },
]
