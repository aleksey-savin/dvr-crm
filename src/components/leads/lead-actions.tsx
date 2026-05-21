import * as React from 'react'
import { useRouter } from '@tanstack/react-router'
import { ArchiveIcon, PlusIcon, XCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConvertToInitiativeDialog } from '@/components/initiatives/convert-to-initiative-dialog'
import { convertLeadToInitiative } from '@/components/initiatives/actions'
import { archiveLead, rejectLead } from '@/components/leads/actions'
import type { LeadRow, PipelineWithStages } from '@/types'

type RefusalReason = { id: string; name: string }

type ReasonDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  refusalReasons: RefusalReason[]
  onConfirm: (reasonId: string) => Promise<void>
}

function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  refusalReasons,
  onConfirm,
}: ReasonDialogProps) {
  const [reasonId, setReasonId] = React.useState<string | null>(null)
  const [isPending, setIsPending] = React.useState(false)

  const handleConfirm = async () => {
    if (!reasonId) {
      toast.error('Выберите причину отказа')
      return
    }
    setIsPending(true)
    try {
      await onConfirm(reasonId)
      onOpenChange(false)
      setReasonId(null)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setReasonId(null)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Select
          value={reasonId ?? ''}
          onValueChange={(v) => setReasonId(v || null)}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите причину" />
          </SelectTrigger>
          <SelectContent>
            {refusalReasons.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button disabled={isPending} onClick={() => void handleConfirm()}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type ConfirmArchiveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

function ConfirmArchiveDialog({
  open,
  onOpenChange,
  onConfirm,
}: ConfirmArchiveDialogProps) {
  const [isPending, setIsPending] = React.useState(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Архивировать лид?</DialogTitle>
          <DialogDescription>
            Лид будет скрыт с доски. Его можно показать через «Показать
            архивные».
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            disabled={isPending}
            onClick={async () => {
              setIsPending(true)
              try {
                await onConfirm()
                onOpenChange(false)
              } finally {
                setIsPending(false)
              }
            }}
          >
            В архив
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type LeadActionsProps = {
  lead: LeadRow
  pipelines: PipelineWithStages[]
  refusalReasons: RefusalReason[]
  context: 'card' | 'sheet'
  onDone?: () => void
  size?: 'xs' | 'sm'
}

export function LeadActions({
  lead,
  pipelines,
  refusalReasons,
  context,
  onDone,
  size = 'xs',
}: LeadActionsProps) {
  const router = useRouter()
  const [convertOpen, setConvertOpen] = React.useState(false)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [archiveReasonOpen, setArchiveReasonOpen] = React.useState(false)
  const [archiveConfirmOpen, setArchiveConfirmOpen] = React.useState(false)

  const isActive = lead.status === 'new' || lead.status === 'in_progress'
  const showArchive = context === 'sheet' || !isActive

  const refresh = async () => {
    await router.invalidate()
    onDone?.()
  }

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

  const handleReject = async (reasonId: string) => {
    try {
      await rejectLead({ data: { id: lead.id, lostReasonId: reasonId } })
      toast.success('Лид отклонён')
      await refresh()
    } catch {
      toast.error('Не удалось отклонить лид')
    }
  }

  const handleArchiveWithReason = async (reasonId: string) => {
    try {
      await archiveLead({ data: { id: lead.id, lostReasonId: reasonId } })
      toast.success('Лид архивирован')
      await refresh()
    } catch {
      toast.error('Не удалось архивировать лид')
    }
  }

  const handleArchiveConverted = async () => {
    try {
      await archiveLead({ data: { id: lead.id } })
      toast.success('Лид архивирован')
      await refresh()
    } catch {
      toast.error('Не удалось архивировать лид')
    }
  }

  const onArchiveClick = () => {
    if (lead.status === 'converted') setArchiveConfirmOpen(true)
    else setArchiveReasonOpen(true)
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {isActive && (
        <>
          <Button
            variant="outline"
            size={size}
            onClick={() => setConvertOpen(true)}
          >
            <PlusIcon className="size-3" />
            Инициатива
          </Button>
          <Button
            variant="outline"
            size={size}
            onClick={() => setRejectOpen(true)}
          >
            <XCircleIcon className="size-3" />
            Отказ
          </Button>
        </>
      )}

      {showArchive && (
        <Button variant="outline" size={size} onClick={onArchiveClick}>
          <ArchiveIcon className="size-3" />В архив
        </Button>
      )}

      <ConvertToInitiativeDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        pipelines={pipelines}
        title="Конвертация лида в инициативу"
        description={
          lead.title
            ? `Лид «${lead.title}»`
            : 'Создание инициативы на основе лида'
        }
        onConvert={handleConvert}
        onSuccess={() => {
          setConvertOpen(false)
          void refresh()
        }}
      />

      <ReasonDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Отклонить лид?"
        description="Выберите причину отказа перед изменением статуса."
        confirmLabel="Отклонить"
        refusalReasons={refusalReasons}
        onConfirm={handleReject}
      />

      <ReasonDialog
        open={archiveReasonOpen}
        onOpenChange={setArchiveReasonOpen}
        title="Архивировать лид?"
        description="Лид не конвертирован, поэтому укажите причину отказа. Он будет помечен как отклонён и скрыт с доски."
        confirmLabel="В архив"
        refusalReasons={refusalReasons}
        onConfirm={handleArchiveWithReason}
      />

      <ConfirmArchiveDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        onConfirm={handleArchiveConverted}
      />
    </div>
  )
}
