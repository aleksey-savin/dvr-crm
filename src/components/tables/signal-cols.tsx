import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useRouter } from '@tanstack/react-router'
import { ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'

import { updateSignalRating } from '@/components/signals/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/ui/star-rating'
import type { SignalRow } from '@/types'

function SignalRatingCell({ signal }: { signal: SignalRow }) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)

  const handleRatingChange = async (rating: number | null) => {
    if (rating === signal.rating) return
    setIsPending(true)
    try {
      await updateSignalRating({ data: { id: signal.id, rating } })
      toast.success('Рейтинг сигнала обновлён')
      await router.invalidate()
    } catch {
      toast.error('Не удалось обновить рейтинг сигнала')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <StarRating
        value={signal.rating}
        readonly={isPending}
        onChange={(rating) => void handleRatingChange(rating)}
      />
    </div>
  )
}

export function getSignalColumns(): ColumnDef<SignalRow>[] {
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
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
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
      accessorKey: 'industryName',
      header: 'Отрасль',
      cell: ({ row }) =>
        row.original.industryName ?? (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'signalTypeName',
      header: 'Тип',
      cell: ({ row }) =>
        row.original.signalTypeName ? (
          <Badge variant="outline">{row.original.signalTypeName}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'rating',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Рейтинг <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => <SignalRatingCell signal={row.original} />,
    },
    {
      accessorKey: 'responsibleUserName',
      header: 'Ответственный',
      cell: ({ row }) =>
        row.original.responsibleUserName ?? (
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
