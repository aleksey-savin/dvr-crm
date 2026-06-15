import type { Column, ColumnDef } from '@tanstack/react-table'
import type * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@tanstack/react-router'
import {
  EditIcon,
  EyeIcon,
  Trash2Icon,
  ArrowUpDown,
  PlusIcon,
} from 'lucide-react'
import { useScopedDepartmentIds } from '@/hooks/use-department-scope'
import { GrossProfitFactDialog } from '@/components/companyAccounts/gross-profit-facts-section'

export type ClientAccountStatus = 'target' | 'regular' | 'lost'

export type ClientAccountTableRow = {
  id: string
  companyId: string
  name: string
  businessUnit: string
  gpLastYear: string | null
  forecastCurrentYear: string | null
  grossProfitFactCurrentYear: string | null
  lostReasons: string | null
  risksCount: number
  upsellingCount: number
  marketerTodosCount: number
  managerTodosCount: number
  managers: string[]
  managerOptions: Array<{ id: string; name: string }>
  status: ClientAccountStatus
}

const currentYear = new Date().getFullYear()
const lastYear = currentYear - 1

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
})

function formatMoney(value: string | null) {
  const amount = parseFloat(value ?? '0')
  return amount ? currency.format(amount) : '—'
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<ClientAccountTableRow>
  children: React.ReactNode
}) {
  return (
    <div className="flex justify-center">
      <Button
        variant="ghost"
        className="font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        {children}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}

export const columns: ColumnDef<ClientAccountTableRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <SortableHeader column={column}>Клиент</SortableHeader>
    ),
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
    header: ({ column }) => (
      <SortableHeader
        column={column}
      >{`Валовая прибыль ${lastYear}`}</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center font-medium">
        {formatMoney(row.original.gpLastYear)}
      </div>
    ),
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce(
          (sum, row) => sum + Number(row.getValue('gpLastYear') ?? 0),
          0,
        )
      return (
        <div className="flex justify-center font-semibold">
          {currency.format(total)}
        </div>
      )
    },
  },
  {
    accessorKey: 'forecastCurrentYear',
    header: ({ column }) => (
      <SortableHeader
        column={column}
      >{`Цель/Прогноз ${currentYear}`}</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center font-medium">
        {formatMoney(row.original.forecastCurrentYear)}
      </div>
    ),
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce(
          (sum, row) => sum + Number(row.getValue('forecastCurrentYear') ?? 0),
          0,
        )
      return (
        <div className="flex justify-center font-semibold">
          {currency.format(total)}
        </div>
      )
    },
  },
  {
    accessorKey: 'grossProfitFactCurrentYear',
    header: ({ column }) => (
      <SortableHeader
        column={column}
      >{`ВП факт ${currentYear}`}</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center font-medium">
        {formatMoney(row.original.grossProfitFactCurrentYear)}
      </div>
    ),
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce(
          (sum, row) =>
            sum + Number(row.getValue('grossProfitFactCurrentYear') ?? 0),
          0,
        )
      return (
        <div className="flex justify-center font-semibold">
          {currency.format(total)}
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
    accessorKey: 'managers',
    header: 'Менеджеры',
    cell: ({ row }) => {
      const managers = row.getValue<string[]>('managers')
      return managers.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {managers.map((manager) => (
            <Badge key={manager} variant="secondary">
              {manager}
            </Badge>
          ))}
        </div>
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
      const router = useRouter()
      return (
        <div className="flex items-center justify-end gap-1">
          {item.managerOptions.length > 0 ? (
            <GrossProfitFactDialog
              accountId={item.id}
              managers={item.managerOptions}
              onRefresh={() => router.invalidate()}
            >
              <Button variant="ghost" size="icon-sm" title="Добавить факт ВП">
                <PlusIcon />
              </Button>
            </GrossProfitFactDialog>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              disabled
              title="Сначала назначьте менеджера"
            >
              <PlusIcon />
            </Button>
          )}
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
