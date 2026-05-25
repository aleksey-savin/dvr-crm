import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { LeadRow } from '@/types'

export const leadColumns: ColumnDef<LeadRow>[] = [
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
      <span className="font-medium">{row.original.title}</span>
    ),
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
    accessorKey: 'industryName',
    header: 'Отрасль',
    cell: ({ row }) =>
      row.original.industryName ?? (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'sourceName',
    header: 'Источник',
    cell: ({ row }) =>
      row.original.sourceName ?? (
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
    cell: ({ row }) => {
      const v = row.original.budget
      if (!v) return <span className="text-muted-foreground">—</span>
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
      }).format(Number(v))
    },
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
    cell: ({ row }) => {
      const d = row.original.dueDate
      if (!d) return <span className="text-muted-foreground">—</span>
      return new Date(d).toLocaleDateString('ru-RU')
    },
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
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Создан <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString('ru-RU'),
  },
]
