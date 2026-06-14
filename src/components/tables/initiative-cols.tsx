import type { ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { InitiativeRow } from '@/types'

function formatCurrency(value: string | null): React.ReactNode {
  if (!value) return <span className="text-muted-foreground">—</span>
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function formatDate(value: string | null | undefined): React.ReactNode {
  if (!value) return <span className="text-muted-foreground">—</span>
  const d = new Date(value)
  const isOverdue = d < new Date()
  return (
    <span className={isOverdue ? 'text-destructive' : ''}>
      {d.toLocaleDateString('ru-RU')}
    </span>
  )
}

export const columns: ColumnDef<InitiativeRow>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Название <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        to="/initiatives/$id/view"
        params={{ id: row.original.id }}
        className="font-medium text-primary hover:underline"
      >
        {row.original.title}
      </Link>
    ),
  },
  {
    accessorKey: 'stageName',
    header: 'Этап',
    cell: ({ row }) => {
      const { stageName, stageColor } = row.original
      if (!stageName) return <span className="text-muted-foreground">—</span>
      return (
        <span className="flex items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: stageColor ?? '#6b7280' }}
          />
          {stageName}
        </span>
      )
    },
  },
  {
    accessorKey: 'companyName',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Компания <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) =>
      row.original.companyName ?? (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'responsibleUserName',
    header: 'Ответственный',
    cell: ({ row }) =>
      row.original.responsibleUserName ?? (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'budget',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Бюджет <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => formatCurrency(row.original.budget),
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Срок <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => formatDate(row.original.dueDate),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Создана <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString('ru-RU'),
  },
]
