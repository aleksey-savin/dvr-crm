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
import type { PipelineWithStages } from '@/types'
import type { EntityConfig, EntityRowBase, RefusalReason } from './types'

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
  title: string
  description: string
  onConfirm: () => Promise<void>
}

function ConfirmArchiveDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: ConfirmArchiveDialogProps) {
  const [isPending, setIsPending] = React.useState(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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

type EntityActionsProps<TRow extends EntityRowBase, TFull> = {
  config: EntityConfig<TRow, TFull>
  row: TRow
  pipelines: PipelineWithStages[]
  refusalReasons: RefusalReason[]
  onDone?: () => void
  size?: 'xs' | 'sm'
}

export function EntityActions<TRow extends EntityRowBase, TFull>({
  config,
  row,
  pipelines,
  refusalReasons,
  onDone,
  size = 'xs',
}: EntityActionsProps<TRow, TFull>) {
  const { words } = config
  const router = useRouter()
  const [convertOpen, setConvertOpen] = React.useState(false)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [archiveConfirmOpen, setArchiveConfirmOpen] = React.useState(false)

  const isActive = row.status === 'new' || row.status === 'in_progress'
  // Only resolved entities (converted / rejected) can be archived.
  const showArchive = row.status === 'converted' || row.status === 'rejected'

  const refresh = async () => {
    await router.invalidate()
    onDone?.()
  }

  const handleReject = async (reasonId: string) => {
    try {
      await config.reject(row.id, reasonId)
      toast.success(`${words.nom} отклонён`)
      await refresh()
    } catch {
      toast.error(`Не удалось отклонить ${words.acc}`)
    }
  }

  const handleArchive = async () => {
    try {
      await config.archive(row.id)
      toast.success(`${words.nom} архивирован`)
      await refresh()
    } catch {
      toast.error(`Не удалось архивировать ${words.acc}`)
    }
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
        <Button
          variant="outline"
          size={size}
          onClick={() => setArchiveConfirmOpen(true)}
        >
          <ArchiveIcon className="size-3" />В архив
        </Button>
      )}

      <ConvertToInitiativeDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        pipelines={pipelines}
        title={`Конвертация ${words.gen} в инициативу`}
        description={
          row.title
            ? `${words.nom} «${row.title}»`
            : `Создание инициативы на основе ${words.gen}`
        }
        onConvert={(args) => config.convert(row, args)}
        onSuccess={() => {
          setConvertOpen(false)
          void refresh()
        }}
      />

      <ReasonDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={`Отклонить ${words.acc}?`}
        description="Выберите причину отказа перед изменением статуса."
        confirmLabel="Отклонить"
        refusalReasons={refusalReasons}
        onConfirm={handleReject}
      />

      <ConfirmArchiveDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        title={`Архивировать ${words.acc}?`}
        description={`${words.nom} будет скрыт с доски. Его можно показать через «Показать архивные».`}
        onConfirm={handleArchive}
      />
    </div>
  )
}
