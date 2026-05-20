import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EmployeeRow } from '@/types'

export const employeeColumns: ColumnDef<EmployeeRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Имя
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    id: 'department',
    accessorKey: 'departmentName',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Подразделение
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => row.original.departmentName ?? '—',
  },
  {
    accessorKey: 'position',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Должность
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => row.original.position ?? '—',
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Телефон
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) =>
      row.original.phone ? (
        <a
          href={`tel:${row.original.phone}`}
          className="text-foreground underline-offset-4 hover:underline"
        >
          {row.original.phone}
        </a>
      ) : (
        '—'
      ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Email
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <a
        href={`mailto:${row.original.email}`}
        className="text-foreground underline-offset-4 hover:underline"
      >
        {row.original.email}
      </a>
    ),
  },
  {
    id: 'lastActivityAt',
    accessorFn: (row) => {
      if (!row.lastActivityAt) return 0
      const date = new Date(row.lastActivityAt)
      return Number.isNaN(date.getTime()) ? 0 : date.getTime()
    },
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Последняя активность
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const value = row.original.lastActivityAt
      if (!value) return '—'
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('ru-RU')
    },
  },
]
