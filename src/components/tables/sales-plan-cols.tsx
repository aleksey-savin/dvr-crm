import type { ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { EditIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { SalesPlanRow } from '@/types'

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

export const columns: ColumnDef<SalesPlanRow>[] = [
  {
    accessorKey: 'departmentName',
    header: 'Подразделение',
  },
  {
    accessorKey: 'userName',
    header: 'Менеджер',
  },
  {
    accessorKey: 'year',
    header: 'Год',
  },
  {
    accessorKey: 'segment',
    header: 'Сегмент',
    cell: ({ row }) =>
      row.original.segment === 'target' ? (
        <Badge variant="secondary">Целевые</Badge>
      ) : (
        <Badge variant="outline">Нецелевые</Badge>
      ),
  },
  {
    accessorKey: 'value',
    header: 'План',
    cell: ({ row }) => (
      <span className="font-medium">
        {currency.format(Number(row.original.value))}
      </span>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/sales-plans/$id/update" params={{ id: row.original.id }}>
            <EditIcon className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="destructiveGhost" size="icon-sm">
          <Link to="/sales-plans/$id/delete" params={{ id: row.original.id }}>
            <Trash2Icon className="size-4" />
          </Link>
        </Button>
      </div>
    ),
  },
]
