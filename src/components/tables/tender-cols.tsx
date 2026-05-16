import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Link, useRouter } from '@tanstack/react-router'
import {
  ArrowUpDown,
  PlayIcon,
  ExternalLinkIcon,
  XCircleIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { rejectTender, updateTenderStatus } from '@/components/tenders/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { TenderRow, TenderStatus } from '@/types'

const STATUS_LABELS: Record<TenderStatus, string> = {
  new: 'Новый',
  evaluation: 'Оценка',
  approval: 'Согласование',
  preparation: 'Подготовка',
  submitted: 'Подан',
  won: 'Выигран',
  lost: 'Проигран',
  rejected: 'Отклонён',
  archived: 'Архив',
}

const STATUS_VARIANTS: Record<
  TenderStatus,
  'secondary' | 'warning' | 'default' | 'success' | 'destructive'
> = {
  new: 'secondary',
  evaluation: 'warning',
  approval: 'warning',
  preparation: 'default',
  submitted: 'default',
  won: 'success',
  lost: 'destructive',
  rejected: 'destructive',
  archived: 'secondary',
}

function TenderStatusCell({ tender }: { tender: TenderRow }) {
  return (
    <Badge variant={STATUS_VARIANTS[tender.status]}>
      {STATUS_LABELS[tender.status]}
    </Badge>
  )
}

function StartTenderWorkAction({ tender }: { tender: TenderRow }) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)

  const handleStartWork = async () => {
    setIsPending(true)
    try {
      await updateTenderStatus({
        data: { id: tender.id, status: 'evaluation' },
      })
      toast.success('Тендер взят в работу')
      await router.invalidate()
    } catch {
      toast.error('Не удалось взять тендер в работу')
    } finally {
      setIsPending(false)
    }
  }

  if (tender.status !== 'new') return null

  return (
    <Button
      variant="outline"
      size="xs"
      disabled={isPending}
      onClick={() => void handleStartWork()}
    >
      <PlayIcon className="size-3" />В работу
    </Button>
  )
}

function RejectTenderAction({ tender }: { tender: TenderRow }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState('')
  const [isPending, setIsPending] = React.useState(false)

  const handleReject = async () => {
    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      toast.error('Укажите причину отклонения')
      return
    }

    setIsPending(true)
    try {
      await rejectTender({
        data: { id: tender.id, reason: trimmedReason },
      })
      toast.success('Тендер отклонён')
      setOpen(false)
      setReason('')
      await router.invalidate()
    } catch {
      toast.error('Не удалось отклонить тендер')
    } finally {
      setIsPending(false)
    }
  }

  if (
    tender.status === 'archived' ||
    tender.status === 'rejected' ||
    tender.status === 'won' ||
    tender.status === 'lost'
  ) {
    return null
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setReason('')
      }}
    >
      <Button
        variant="outline"
        size="xs"
        disabled={isPending}
        onClick={() => setOpen(true)}
      >
        <XCircleIcon className="size-3" />
        Отклонить
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отклонить тендер?</DialogTitle>
          <DialogDescription>
            Укажите причину отклонения перед изменением статуса.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Причина отклонения"
          disabled={isPending}
        />
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            Отмена
          </Button>
          <Button disabled={isPending} onClick={() => void handleReject()}>
            Отклонить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const columns: ColumnDef<TenderRow>[] = [
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
          <Link
            to="/tenders/$id/view"
            params={{ id: row.original.id }}
            className="font-medium text-primary hover:underline"
          >
            {title}
          </Link>
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
      row.original.platform ?? <span className="text-muted-foreground">—</span>,
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
  /* {
    accessorKey: 'responsibleUserName',
    header: 'Ответственный',
    cell: ({ row }) =>
      row.original.responsibleUserName ?? (
        <span className="text-muted-foreground">—</span>
      ),
  }, */
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
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ row }) => <TenderStatusCell tender={row.original} />,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <StartTenderWorkAction tender={row.original} />
        <RejectTenderAction tender={row.original} />
      </div>
    ),
  },
]
