import * as React from 'react'
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
import { Field, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { cancelMeeting } from '@/components/meetings/actions'

type Props = {
  meetingId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancelled?: () => void
}

export function CancelMeetingDialog({
  meetingId,
  open,
  onOpenChange,
  onCancelled,
}: Props) {
  const [reason, setReason] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) setReason('')
  }, [open])

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Укажите причину отмены')
      return
    }
    setIsSubmitting(true)
    try {
      await cancelMeeting({ data: { id: meetingId, reason: reason.trim() } })
      toast.success('Встреча отменена')
      onOpenChange(false)
      onCancelled?.()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Не удалось отменить встречу',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Отмена встречи</DialogTitle>
          <DialogDescription>
            Встреча будет помечена как отменённая, бронь переговорки
            освободится. Причина сохранится в карточке встречи.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel>Причина отмены *</FieldLabel>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Например: клиент отказался, потеряла актуальность"
            rows={3}
            disabled={isSubmitting}
          />
        </Field>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Закрыть
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Отмена...' : 'Отменить встречу'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
