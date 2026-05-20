import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { usePipelinesStore } from '@/stores/pipelines-store'
import { ArchiveIcon, ArrowUpDown, PlusIcon, PlayIcon } from 'lucide-react'
import { toast } from 'sonner'

import {
  archiveSignal,
  updateSignalRating,
  updateSignalStatus,
} from '@/components/signals/actions'
import { convertSignalToInitiative } from '@/components/initiatives/actions'
import { ConvertToInitiativeDialog } from '@/components/initiatives/convert-to-initiative-dialog'
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
import { StarRating } from '@/components/ui/star-rating'
import { Textarea } from '@/components/ui/textarea'
import type { SignalRow, SignalStatus, PipelineWithStages } from '@/types'

const STATUS_LABELS: Record<SignalStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  converted: 'Конвертирован',
  archived: 'Архив',
}

const STATUS_VARIANTS: Record<
  SignalStatus,
  'secondary' | 'warning' | 'success'
> = {
  new: 'secondary',
  in_progress: 'warning',
  converted: 'success',
  archived: 'secondary',
}

function SignalStatusCell({ signal }: { signal: SignalRow }) {
  return (
    <Badge variant={STATUS_VARIANTS[signal.status]}>
      {STATUS_LABELS[signal.status]}
    </Badge>
  )
}

function StartSignalWorkAction({ signal }: { signal: SignalRow }) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)

  const handleStartWork = async () => {
    setIsPending(true)
    try {
      await updateSignalStatus({
        data: { id: signal.id, status: 'in_progress' },
      })
      toast.success('Сигнал взят в работу')
      await router.invalidate()
    } catch {
      toast.error('Не удалось взять сигнал в работу')
    } finally {
      setIsPending(false)
    }
  }

  if (signal.status !== 'new') return null

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

function SignalRatingCell({ signal }: { signal: SignalRow }) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)

  const handleRatingChange = async (rating: number | null) => {
    if (rating === signal.rating) return

    setIsPending(true)
    try {
      await updateSignalRating({
        data: { id: signal.id, rating },
      })
      toast.success('Рейтинг сигнала обновлён')
      await router.invalidate()
    } catch {
      toast.error('Не удалось обновить рейтинг сигнала')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <StarRating
      value={signal.rating}
      readonly={isPending}
      onChange={(rating) => void handleRatingChange(rating)}
    />
  )
}

function CreateSignalInitiativeAction({
  signal,
  pipelines,
}: {
  signal: SignalRow
  pipelines: PipelineWithStages[]
}) {
  const router = useRouter()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = React.useState(false)

  const handleConvert = ({
    pipelineId,
    stageId,
  }: {
    pipelineId: string
    stageId: string
  }) =>
    convertSignalToInitiative({
      data: {
        signalId: signal.id,
        title: signal.title,
        pipelineId,
        stageId,
        companyId: signal.companyId,
        departmentId: signal.departmentId,
        responsibleUserId: signal.responsibleUserId,
      },
    })

  const handleSuccess = () => {
    setIsOpen(false)
    void router.invalidate()
    void navigate({ to: '/initiatives' })
  }

  if (signal.status === 'converted' || signal.status === 'archived') return null

  return (
    <>
      <Button variant="outline" size="xs" onClick={() => setIsOpen(true)}>
        <PlusIcon className="size-3" />
        Инициатива
      </Button>
      <ConvertToInitiativeDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        pipelines={pipelines}
        title="Конвертация сигнала в инициативу"
        description={
          signal.title
            ? `Сигнал «${signal.title}»`
            : 'Создание инициативы на основе сигнала'
        }
        onConvert={handleConvert}
        onSuccess={handleSuccess}
      />
    </>
  )
}

function ArchiveSignalAction({ signal }: { signal: SignalRow }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState('')
  const [isPending, setIsPending] = React.useState(false)

  const handleArchive = async () => {
    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      toast.error('Укажите причину архивации')
      return
    }

    setIsPending(true)
    try {
      await archiveSignal({
        data: { id: signal.id, reason: trimmedReason },
      })
      toast.success('Сигнал отправлен в архив')
      setOpen(false)
      setReason('')
      await router.invalidate()
    } catch {
      toast.error('Не удалось отправить сигнал в архив')
    } finally {
      setIsPending(false)
    }
  }

  if (signal.status === 'archived' || signal.status === 'converted') return null

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
        <ArchiveIcon className="size-3" />В архив
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отправить сигнал в архив?</DialogTitle>
          <DialogDescription>
            Укажите причину архивации перед изменением статуса.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Причина архивации"
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
          <Button disabled={isPending} onClick={() => void handleArchive()}>
            В архив
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SignalActionsCell({ signal }: { signal: SignalRow }) {
  const pipelines = usePipelinesStore((s) => s.pipelines)
  return (
    <div className="flex items-center justify-end gap-1">
      <StartSignalWorkAction signal={signal} />
      <CreateSignalInitiativeAction signal={signal} pipelines={pipelines} />
      <ArchiveSignalAction signal={signal} />
    </div>
  )
}

export const signalColumns: ColumnDef<SignalRow>[] = [
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
      <Link
        to="/signals/$id/view"
        params={{ id: row.original.id }}
        className="font-medium text-primary hover:underline"
      >
        {row.original.title}
      </Link>
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
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ row }) => <SignalStatusCell signal={row.original} />,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <SignalActionsCell signal={row.original} />,
  },
]
