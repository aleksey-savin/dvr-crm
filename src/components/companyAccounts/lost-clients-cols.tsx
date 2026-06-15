import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { EditIcon, EyeIcon, Trash2Icon, ArrowUpDown } from 'lucide-react'
import { useScopedDepartmentIds } from '@/hooks/use-department-scope'
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
      const scoped = useScopedDepartmentIds()
      const showDepartment = !scoped || scoped.size > 1

      return (
        <div className="flex flex-col">
          <Link
            to="/companies/$id/view"
            params={{ id: account.companyId }}
            search={{ tab: account.id }}
            className="hover:underline"
          >
            {account.name}
          </Link>
          {showDepartment && (
            <div className="text-xs text-muted-foreground">
              {account.businessUnit}
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
      const amount = parseFloat(row.original.potentialNextYear ?? '0')
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
      const count = row.getValue<number>('upsellingCount')
      return (
        <div className="flex justify-center">
          <Badge variant="secondary">{count}</Badge>
        </div>
      )
    },
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce(
          (sum, row) => sum + row.getValue<number>('upsellingCount'),
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
      const count = row.getValue<number>('marketerTodosCount')
      return (
        <div className="flex justify-center">
          <Badge variant="secondary">{count}</Badge>
        </div>
      )
    },
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce(
          (sum, row) => sum + row.getValue<number>('marketerTodosCount'),
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
      const count = row.getValue<number>('managerTodosCount')
      return (
        <div className="flex justify-center">
          <Badge variant="secondary">{count}</Badge>
        </div>
      )
    },
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce(
          (sum, row) => sum + row.getValue<number>('managerTodosCount'),
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
            <Link
              to="/companies/$id/view"
              params={{ id: account.companyId }}
              search={{ tab: account.id }}
            >
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
