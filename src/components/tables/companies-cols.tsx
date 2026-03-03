import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from '@tanstack/react-router'
import { ArrowUpDown, EditIcon, EyeIcon, Trash2Icon } from 'lucide-react'

export type ClientStatus = {
  departmentName: string
  target: boolean
  lost: boolean
}

export type Company = {
  id: string
  name: string
  description: string | null
  regionalMarketPosition: string | null
  clients: ClientStatus[]
  isWishlist: boolean
  revenueLastYear: string | null
  revenueTwoYearsAgo: string | null
}

export const columns: ColumnDef<Company>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-3"
      >
        Наименование
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('name')}</span>
    ),
  },
  {
    accessorKey: 'regionalMarketPosition',
    header: 'Позиция на рынке',
    cell: ({ row }) => {
      const value = row.getValue<string | null>('regionalMarketPosition')
      return value ? (
        <span className="text-muted-foreground text-sm line-clamp-1">
          {value}
        </span>
      ) : (
        <span className="text-muted-foreground/40 text-sm">—</span>
      )
    },
  },
  {
    id: 'status',
    header: 'Статус',
    cell: ({ row }) => {
      const { clients, isWishlist } = row.original
      if (!isWishlist && clients.length === 0) return null
      return (
        <div className="flex flex-wrap gap-1">
          {isWishlist && <Badge variant="secondary">Вишлист</Badge>}
          {clients.map((c, i) => {
            if (c.lost) {
              return (
                <Badge key={i} variant="destructive">
                  {c.departmentName} — Потерянный
                </Badge>
              )
            }
            if (c.target) {
              return (
                <Badge key={i} variant="success">
                  {c.departmentName} — Целевой
                </Badge>
              )
            }
            return (
              <Badge key={i} variant="default">
                {c.departmentName} — Нецелевой
              </Badge>
            )
          })}
        </div>
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
      if (!revenueLastYear && !revenueTwoYearsAgo) {
        return <span className="text-muted-foreground/40 text-sm">—</span>
      }
      return (
        <div className="flex flex-col gap-0.5 text-sm">
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
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/companies/$id/view" params={{ id: row.original.id }}>
            <EyeIcon />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/companies/$id/update" params={{ id: row.original.id }}>
            <EditIcon />
          </Link>
        </Button>
        <Button asChild variant="destructiveGhost" size="icon-sm">
          <Link to="/companies/$id/delete" params={{ id: row.original.id }}>
            <Trash2Icon />
          </Link>
        </Button>
      </div>
    ),
  },
]
