import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { ArrowUpDown, GripVerticalIcon } from 'lucide-react'
import type { WishlistAccountRow, WishlistTodo } from '@/types'
import { WishlistRowActions } from '@/components/companyAccounts/wishlist-row-actions'

export type { WishlistAccountRow, WishlistTodo }

export const columns: ColumnDef<WishlistAccountRow>[] = [
  {
    id: 'position',
    accessorKey: 'position',
    header: '№',
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-muted-foreground">
        <GripVerticalIcon className="size-4" />
        <span className="min-w-5 text-sm tabular-nums">
          {row.original.position ?? '—'}
        </span>
      </div>
    ),
  },
  {
    id: 'companyName',
    accessorKey: 'companyName',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Клиент
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        to="/companies/$id/view"
        params={{ id: row.original.companyId }}
        search={{ tab: row.original.id }}
        className="font-medium hover:underline min-w-36 block"
      >
        {row.original.companyName}
      </Link>
    ),
  },
  {
    id: 'businessUnits',
    accessorKey: 'businessUnits',
    header: 'Подразделения',
    cell: ({ row }) => {
      return (
        <div className="flex flex-wrap gap-1.5 max-w-52">
          {row.original.businessUnits.map((name) => (
            <Badge key={name} variant="secondary">
              {name}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: 'industry',
    header: 'Отрасль',
    cell: ({ row }) => {
      const value = row.getValue<string | null>('industry')
      return value ? (
        <span className="text-sm">{value}</span>
      ) : (
        <span className="text-muted-foreground/40 text-sm">—</span>
      )
    },
  },
  {
    accessorKey: 'regionalMarketPosition',
    header: 'Позиция в рейтинге',
    cell: ({ row }) => {
      const value = row.getValue<string | null>('regionalMarketPosition')
      return value ? (
        <span className="text-muted-foreground text-sm line-clamp-2 max-w-48">
          {value}
        </span>
      ) : (
        <span className="text-muted-foreground/40 text-sm">—</span>
      )
    },
  },
  {
    id: 'revenue',
    header: 'Выручка',
    cell: ({ row }) => {
      const { revenueLastYear, revenueTwoYearsAgo } = row.original
      const currentYear = new Date().getFullYear()
      const fmt = (v: string) =>
        Number(v).toLocaleString('ru-RU', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      if (!revenueLastYear && !revenueTwoYearsAgo)
        return <span className="text-muted-foreground/40 text-sm">—</span>
      return (
        <div className="flex flex-col gap-0.5 text-sm whitespace-nowrap">
          {revenueTwoYearsAgo && (
            <span className="text-muted-foreground">
              {currentYear - 2}: {fmt(revenueTwoYearsAgo)}
            </span>
          )}
          {revenueLastYear && (
            <span className="font-medium">
              {currentYear - 1}: {fmt(revenueLastYear)}
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'why',
    header: 'Почему хотим',
    cell: ({ row }) => {
      const value = row.getValue<string | null>('why')
      return value ? (
        <span className="text-sm line-clamp-3 max-w-52 whitespace-normal">
          {value}
        </span>
      ) : (
        <span className="text-muted-foreground/40 text-sm">—</span>
      )
    },
  },
  {
    accessorKey: 'wishlistOffer',
    header: 'Что предлагаем',
    cell: ({ row }) => {
      const value = row.getValue<string | null>('wishlistOffer')
      return value ? (
        <span className="text-sm line-clamp-3 max-w-56 whitespace-normal">
          {value}
        </span>
      ) : (
        <span className="text-muted-foreground/40 text-sm">—</span>
      )
    },
  },
  {
    id: 'hooks',
    accessorFn: (row) => row.hooks,
    header: 'Хуки',
    cell: ({ row }) => {
      const { hooks } = row.original
      if (hooks.length === 0)
        return <span className="text-muted-foreground/40 text-sm">—</span>
      return (
        <div className="flex flex-col gap-1 max-w-56">
          {hooks.map((hook, i) => (
            <span key={i} className="text-sm line-clamp-2 whitespace-normal">
              • {hook}
            </span>
          ))}
        </div>
      )
    },
  },
  {
    id: 'todos',
    accessorFn: (row) =>
      row.todos.filter((t) => t.status !== 'completed').length,
    header: () => <div className="flex justify-center">Задачи</div>,
    cell: ({ row }) => {
      const activeCount = row.getValue<number>('todos')
      return (
        <div className="flex justify-center">
          {activeCount > 0 ? (
            <Badge variant="secondary">{activeCount}</Badge>
          ) : (
            <span className="text-muted-foreground/40 text-sm">—</span>
          )}
        </div>
      )
    },
  },
  {
    id: 'responsibles',
    accessorKey: 'responsibles',
    header: 'Ответственные',
    cell: ({ row }) => {
      const names = row.original.responsibles
      if (names.length === 0)
        return <span className="text-muted-foreground/40 text-sm">—</span>
      return (
        <div className="flex flex-wrap gap-1.5 max-w-44">
          {names.map((name) => (
            <Badge key={name} variant="secondary">
              {name}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <WishlistRowActions
          id={row.original.id}
          currentState={row.original.wishlistState}
        />
      </div>
    ),
  },
]
