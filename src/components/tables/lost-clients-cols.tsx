import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Link } from '@tanstack/react-router'
import { EditIcon, EyeIcon, Trash2Icon, ArrowUpDown } from 'lucide-react'
import { useDepartmentStore } from '@/stores/department-store'
import type { LostClientAccountRow } from '@/types'

const currentYear = new Date().getFullYear()

export const columns: ColumnDef<LostClientAccountRow>[] = [
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
      const account = row.original
      const selectedDepartmentId = useDepartmentStore(
        (s) => s.selectedDepartmentId,
      )

      return (
        <div className="flex flex-col">
          <div>{account.name as any as React.ReactNode}</div>
          {!selectedDepartmentId && (
            <div className="text-xs text-muted-foreground">
              {account.businessUnit as any as React.ReactNode}
            </div>
          )}
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
      const amount = parseFloat(row.getValue('potentialNextYear') ?? '0')
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
          (sum, row) => sum + Number(row.getValue('potentialNextYear') ?? 0),
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
    header: 'Причина потери',
    cell: ({ row }) => {
      const value = row.getValue<string | null>('lostReasons')
      return value ? (
        <span className="text-sm">{value}</span>
      ) : (
        <span className="text-muted-foreground/40 text-sm">—</span>
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
    accessorKey: 'owner',
    header: 'Ответственный',
    cell: ({ row }) => {
      const owner = row.getValue<string | null>('owner')
      return owner ? (
        <Badge variant="secondary">{owner}</Badge>
      ) : (
        <span className="text-muted-foreground/40 text-sm">—</span>
      )
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const account = row.original
      return (
        <div className="flex items-center justify-end gap-1">
          <Button asChild variant="ghost" size="icon-sm">
            <Link to="/clients/$id/view" params={{ id: account.id }}>
              <EyeIcon />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon-sm">
            <Link to="/clients/$id/update" params={{ id: account.id }}>
              <EditIcon />
            </Link>
          </Button>
          <Button asChild variant="destructiveGhost" size="icon-sm">
            <Link to="/clients/$id/delete" params={{ id: account.id }}>
              <Trash2Icon />
            </Link>
          </Button>
        </div>
      )
    },
  },
]
