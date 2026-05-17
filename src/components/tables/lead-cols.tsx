import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowUpDown, PlusIcon, PlayIcon, XCircleIcon } from 'lucide-react'
import { toast } from 'sonner'

import { rejectLead, updateLeadStatus } from '@/components/leads/actions'
import { convertLeadToInitiative } from '@/components/initiatives/actions'
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
import { Textarea } from '@/components/ui/textarea'
import type { LeadRow, LeadStatus, PipelineWithStages } from '@/types'

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  converted: 'Конвертирован',
  rejected: 'Отклонён',
}

const STATUS_VARIANTS: Record<
  LeadStatus,
  'secondary' | 'warning' | 'success' | 'destructive'
> = {
  new: 'secondary',
  in_progress: 'warning',
  converted: 'success',
  rejected: 'destructive',
}

function LeadStatusCell({ lead }: { lead: LeadRow }) {
  return (
    <Badge variant={STATUS_VARIANTS[lead.status]}>
      {STATUS_LABELS[lead.status]}
    </Badge>
  )
}

function StartLeadWorkAction({ lead }: { lead: LeadRow }) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)

  const handleStartWork = async () => {
    setIsPending(true)
    try {
      await updateLeadStatus({
        data: { id: lead.id, status: 'in_progress' },
      })
      toast.success('Лид взят в работу')
    } catch {
      toast.error('Не удалось взять лид в работу')
      return
    } finally {
      setIsPending(false)
    }

    try {
      await router.invalidate()
    } catch (error) {
      console.error('Failed to refresh leads after status update', error)
    }
  }

  if (lead.status !== 'new') return null

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

function CreateLeadInitiativeAction({
  lead,
  pipelines,
}: {
  lead: LeadRow
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
    convertLeadToInitiative({
      data: {
        leadId: lead.id,
        title: lead.title,
        pipelineId,
        stageId,
        companyId: lead.companyId,
        departmentId: lead.departmentId,
        responsibleUserId: lead.responsibleUserId,
        budget: lead.budget,
        dueDate: lead.dueDate,
      },
    })

  const handleSuccess = () => {
    setIsOpen(false)
    void router.invalidate()
    void navigate({ to: '/initiatives' })
  }

  if (lead.status !== 'in_progress') return null

  return (
    <>
      <Button
        variant="outline"
        size="xs"
        onClick={() => setIsOpen(true)}
      >
        <PlusIcon className="size-3" />
        Инициатива
      </Button>
      <ConvertToInitiativeDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        pipelines={pipelines}
        title="Конвертация лида в инициативу"
        description={lead.title ? `Лид «${lead.title}»` : 'Создание инициативы на основе лида'}
        onConvert={handleConvert}
        onSuccess={handleSuccess}
      />
    </>
  )
}

function RejectLeadAction({ lead }: { lead: LeadRow }) {
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
      await rejectLead({
        data: { id: lead.id, lostReasonId: trimmedReason },
      })
      toast.success('Лид отклонён')
      setOpen(false)
      setReason('')
      await router.invalidate()
    } catch {
      toast.error('Не удалось отклонить лид')
    } finally {
      setIsPending(false)
    }
  }

  if (lead.status !== 'in_progress') return null

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
          <DialogTitle>Отклонить лид?</DialogTitle>
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

export function getColumns(
  pipelines: PipelineWithStages[],
): ColumnDef<LeadRow>[] {
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
      <Link
        to="/leads/$id/view"
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
    accessorKey: 'sourceName',
    header: 'Источник',
    cell: ({ row }) =>
      row.original.sourceName ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'budget',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Бюджет <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const v = row.original.budget
      if (!v) return <span className="text-muted-foreground">—</span>
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
      }).format(Number(v))
    },
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Срок <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const d = row.original.dueDate
      if (!d) return <span className="text-muted-foreground">—</span>
      return new Date(d).toLocaleDateString('ru-RU')
    },
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
    cell: ({ row }) => <LeadStatusCell lead={row.original} />,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <StartLeadWorkAction lead={row.original} />
        <CreateLeadInitiativeAction lead={row.original} pipelines={pipelines} />
        <RejectLeadAction lead={row.original} />
      </div>
    ),
  },
]
}
