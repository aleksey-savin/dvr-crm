import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { EditIcon, EyeIcon, Trash2Icon, ArrowUpDown } from 'lucide-react'
import { useScopedDepartmentIds } from '@/hooks/use-department-scope'
import type { ClientAccountRow } from '@/types'

export type { ClientAccountRow }

const currentYear = new Date().getFullYear()
const lastYear = currentYear - 1

export const columns: ColumnDef<ClientAccountRow>[] = [
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
      const item = row.original
      const scoped = useScopedDepartmentIds()
      const showDepartment = !scoped || scoped.size > 1

      return (
        <div className="flex justify-start">
          <div className="flex flex-col">
            <Link
              to="/companies/$id/view"
              params={{ id: item.companyId }}
              search={{ tab: item.id }}
              className="hover:underline"
            >
              {item.name}
            </Link>
            {showDepartment && (
              <div className="text-xs text-muted-foreground">
                {item.businessUnit}
              </div>
            )}
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
      const amount = parseFloat(row.original.gpLastYear ?? '0')
      const formatted = amount
        ? new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
          }).format(amount)
        : '—'

      return <div className="font-medium flex justify-center">{formatted}</div>
    },
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce(
          (sum, row) => sum + Number(row.getValue('gpLastYear') ?? 0),
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
    accessorKey: 'forecastCurrentYear',
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
      const amount = parseFloat(row.original.forecastCurrentYear ?? '0')
      const formatted = amount
        ? new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
          }).format(amount)
        : '—'

      return <div className="font-medium flex justify-center">{formatted}</div>
    },
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce(
          (sum, row) => sum + Number(row.getValue('forecastCurrentYear') ?? 0),
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
      const count = row.getValue<number>('risksCount')
      return (
        <div className="flex justify-center">
          <Badge variant="destructive">{count}</Badge>
        </div>
      )
    },
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce((sum, row) => sum + row.getValue<number>('risksCount'), 0)
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
      const item = row.original
      return (
        <div className="flex items-center justify-end gap-1">
          <Button asChild variant="ghost" size="icon-sm">
            <Link
              to="/companies/$id/view"
              params={{ id: item.companyId }}
              search={{ tab: item.id }}
            >
              <EyeIcon />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon-sm">
            <Link to="/clients/$id/update" params={{ id: item.id }}>
              <EditIcon />
            </Link>
          </Button>
          <Button asChild variant="destructiveGhost" size="icon-sm">
            <Link to="/clients/$id/delete" params={{ id: item.id }}>
              <Trash2Icon />
            </Link>
          </Button>
        </div>
      )
    },
  },
]
