import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Link } from '@tanstack/react-router'
import { EditIcon, EyeIcon, Trash2Icon, ArrowUpDown } from 'lucide-react'

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Client = {
  id: string
  name: string
  department: string
  gpLastYear: string
  forecastCurrentYear: string
  risksCount: number
  upsellingCount: number
  marketerTodosCount: number
  managerTodosCount: number
  managers: string[]
}

const currentYear = new Date().getFullYear()
const lastYear = currentYear - 1

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Клиент
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const client = row.original

      return (
        <div className="flex justify-start">
          <div className="flex flex-col">
            <div> {client.name as any as React.ReactNode}</div>
            <div className="text-xs text-muted-foreground">
              {client.department as any as React.ReactNode}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'gpLastYear',
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {`Валовая прибыль ${lastYear}`}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('gpLastYear'))
      const formatted = amount
        ? new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
          }).format(amount)
        : '-'

      return <div className="font-medium flex justify-center">{formatted}</div>
    },
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce((sum, row) => sum + Number(row.getValue('gpLastYear')), 0)
      return (
        <div className="font-semibold flex justify-center">
          {new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
          }).format(total)}
        </div>
      )
    },
  },
  {
    accessorKey: 'forecastCurrentYear',
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          {' '}
          <Button
            variant="ghost"
            className="font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {`Цель/Прогноз ${currentYear}`}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('forecastCurrentYear'))
      const formatted = amount
        ? new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
          }).format(amount)
        : '-'

      return <div className="font-medium flex justify-center">{formatted}</div>
    },
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce(
          (sum, row) => sum + Number(row.getValue('forecastCurrentYear')),
          0,
        )
      return (
        <div className="font-semibold flex justify-center">
          {new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
          }).format(total)}
        </div>
      )
    },
  },
  {
    accessorKey: 'risksCount',
    header: () => <div className="flex justify-center">Риски</div>,
    cell: ({ row }) => {
      const count = row.getValue('risksCount')
      return (
        <div className="flex justify-center">
          <Badge variant="destructive">{count as React.ReactNode}</Badge>
        </div>
      )
    },
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce(
          (sum, row) => sum + (row.getValue('risksCount') as number),
          0,
        )
      return (
        <div className="flex justify-center">
          <Badge variant="destructive" className="font-semibold">
            {total}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: 'upsellingCount',
    header: () => <div className="flex justify-center">Апсейл</div>,
    cell: ({ row }) => {
      const count = row.getValue('upsellingCount')
      return (
        <div className="flex justify-center">
          <Badge variant="secondary">{count as React.ReactNode}</Badge>
        </div>
      )
    },
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce(
          (sum, row) => sum + (row.getValue('upsellingCount') as number),
          0,
        )
      return (
        <div className="flex justify-center">
          <Badge variant="secondary" className="font-semibold">
            {total}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: 'marketerTodosCount',
    header: () => <div className="flex justify-center">Задачи маркетолога</div>,
    cell: ({ row }) => {
      const count = row.getValue('marketerTodosCount')
      return (
        <div className="flex justify-center">
          <Badge variant="secondary">{count as React.ReactNode}</Badge>
        </div>
      )
    },
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce(
          (sum, row) => sum + (row.getValue('marketerTodosCount') as number),
          0,
        )
      return (
        <div className="flex justify-center">
          <Badge variant="secondary" className="font-semibold">
            {total}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: 'managerTodosCount',
    header: () => <div className="flex justify-center">Задачи менеджера</div>,
    cell: ({ row }) => {
      const count = row.getValue('managerTodosCount')
      return (
        <div className="flex justify-center">
          <Badge variant="secondary">{count as React.ReactNode}</Badge>
        </div>
      )
    },
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce(
          (sum, row) => sum + (row.getValue('managerTodosCount') as number),
          0,
        )
      return (
        <div className="flex justify-center">
          <Badge variant="secondary" className="font-semibold">
            {total}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: 'managers',
    header: 'Менеджеры',
    cell: ({ row }) => {
      const managers = row.getValue('managers')
      return (
        <div className="flex flex-wrap gap-2">
          {(managers as any[]).map((manager: any) => (
            <Badge key={manager} variant="secondary">
              {manager}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const client = row.original
      return (
        <div className="flex items-center justify-end gap-1">
          <Button asChild variant="ghost" size="icon-sm">
            <Link to="/clients/$id/view" params={{ id: client.id }}>
              <EyeIcon />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon-sm">
            <Link to="/clients/$id/update" params={{ id: client.id }}>
              <EditIcon />
            </Link>
          </Button>
          <Button asChild variant="destructiveGhost" size="icon-sm">
            <Link to="/clients/$id/delete" params={{ id: client.id }}>
              <Trash2Icon />
            </Link>
          </Button>
        </div>
      )
    },
  },
]
