import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import {
  ArrowUpDown,
  EditIcon,
  EyeIcon,
  MessageSquareIcon,
  Trash2Icon,
} from 'lucide-react'
import type { WishlistAccountRow, WishlistTodo } from '@/types'

export type { WishlistAccountRow, WishlistTodo }

const todoStatusVariant: Record<
  WishlistTodo['status'],
  'warning' | 'default' | 'success'
> = {
  'not started': 'warning',
  'in progress': 'default',
  completed: 'success',
}

export const columns: ColumnDef<WishlistAccountRow>[] = [
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
    id: 'businessUnit',
    accessorKey: 'businessUnit',
    header: 'Подразделение',
    cell: ({ row }) => {
      const name = row.original.businessUnit
      return <Badge variant="secondary">{name}</Badge>
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
    accessorFn: (row) => row.todos.map((t) => t.name),
    header: 'Задачи',
    cell: ({ row }) => {
      const { todos } = row.original
      if (todos.length === 0)
        return <span className="text-muted-foreground/40 text-sm">—</span>
      return (
        <div className="flex flex-wrap gap-1.5 max-w-56">
          {todos.map((todo) => (
            <Badge key={todo.id} variant={todoStatusVariant[todo.status]}>
              {todo.name}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    id: 'commentsCount',
    accessorKey: 'commentsCount',
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          <MessageSquareIcon className="h-4 w-4" />
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const count = row.getValue<number>('commentsCount')
      return (
        <div className="flex justify-center">
          {count > 0 ? (
            <Badge variant="secondary">{count}</Badge>
          ) : (
            <span className="text-muted-foreground/40 text-sm">—</span>
          )}
        </div>
      )
    },
  },
  {
    id: 'responsible',
    accessorKey: 'responsible',
    header: 'Ответственный',
    cell: ({ row }) => {
      const name = row.original.responsible
      if (!name)
        return <span className="text-muted-foreground/40 text-sm">—</span>
      return <Badge variant="secondary">{name}</Badge>
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button asChild variant="ghost" size="icon-sm">
          <Link
            to="/companies/$id/view"
            params={{ id: row.original.companyId }}
            search={{ tab: row.original.id }}
          >
            <EyeIcon />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/wishlist/$id/update" params={{ id: row.original.id }}>
            <EditIcon />
          </Link>
        </Button>
        <Button asChild variant="destructiveGhost" size="icon-sm">
          <Link to="/wishlist/$id/delete" params={{ id: row.original.id }}>
            <Trash2Icon />
          </Link>
        </Button>
      </div>
    ),
  },
]
