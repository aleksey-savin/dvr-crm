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
  forecastCurrentYear: string
  lostReasons: string
  upsellingCount: number
  marketerTodosCount: number
  managerTodosCount: number
  managers: string[]
}

const currentYear = new Date().getFullYear()

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Клиент
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const client = row.original

      return (
        <div className="flex flex-col">
          <div> {client.name as any as React.ReactNode}</div>
          <div className="text-xs text-muted-foreground">
            {client.department as any as React.ReactNode}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'potentialNextYear',
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
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
      const amount = parseFloat(row.getValue('potentialNextYear'))
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
          (sum, row) => sum + Number(row.getValue('potentialNextYear')),
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
    accessorKey: 'lostReasons',
    header: 'Статус прекращения взаимодействия',
    cell: ({ row }) => {
      const lostReason = row.getValue('lostReasons')
      return lostReason
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
