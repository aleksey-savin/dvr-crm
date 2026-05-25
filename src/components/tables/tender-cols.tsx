import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ExternalLinkIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { TenderRow } from '@/types'

export function getTenderColumns(): ColumnDef<TenderRow>[] {
  return [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Название <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const { title, url } = row.original
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-medium">{title}</span>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLinkIcon className="size-3.5 text-muted-foreground hover:text-foreground" />
              </a>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'companyName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Компания <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) =>
        row.original.companyName ?? (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'platform',
      header: 'Площадка',
      cell: ({ row }) =>
        row.original.platform ?? (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Сумма <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const v = row.original.amount
        if (!v) return <span className="text-muted-foreground">—</span>
        return new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB',
          maximumFractionDigits: 0,
        }).format(Number(v))
      },
    },
    {
      accessorKey: 'deadline',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Дедлайн <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const d = row.original.deadline
        if (!d) return <span className="text-muted-foreground">—</span>
        return new Date(d).toLocaleDateString('ru-RU')
      },
    },
    {
      accessorKey: 'approverUserName',
      header: 'Согласующий',
      cell: ({ row }) =>
        row.original.approverUserName ?? (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Создан <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString('ru-RU'),
    },
  ]
}
