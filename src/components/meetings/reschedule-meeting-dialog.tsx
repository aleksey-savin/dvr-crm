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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { rescheduleMeeting } from '@/components/meetings/actions'
import { datetimeLocalToISO, toDatetimeLocalInput } from '@/lib/datetime'

type Props = {
  meetingId: string
  /** Текущее время встречи — для предзаполнения новой даты. */
  currentScheduledAt?: Date | string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRescheduled?: () => void
}

export function RescheduleMeetingDialog({
  meetingId,
  currentScheduledAt = null,
  open,
  onOpenChange,
  onRescheduled,
}: Props) {
  const [newDate, setNewDate] = React.useState(toDatetimeLocalInput(new Date()))
  const [reason, setReason] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setNewDate(toDatetimeLocalInput(currentScheduledAt ?? new Date()))
      setReason('')
    }
  }, [open, currentScheduledAt])

  const handleSubmit = async () => {
    if (!newDate) {
      toast.error('Укажите новую дату')
      return
    }
    if (!reason.trim()) {
      toast.error('Укажите причину переноса')
      return
    }
    setIsSubmitting(true)
    try {
      await rescheduleMeeting({
        data: {
          id: meetingId,
          // datetime-local (локальная зона браузера) → UTC ISO для сервера.
          newScheduledAt: datetimeLocalToISO(newDate) ?? newDate,
          reason: reason.trim(),
        },
      })
      toast.success('Встреча перенесена')
      onOpenChange(false)
      onRescheduled?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось перенести')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Перенос встречи</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field>
            <FieldLabel>Новая дата и время</FieldLabel>
            <Input
              type="datetime-local"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              disabled={isSubmitting}
            />
          </Field>
          <Field>
            <FieldLabel>Причина переноса *</FieldLabel>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Например: клиент отменил, перенесли по согласованию"
              rows={3}
              disabled={isSubmitting}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? 'Перенос...' : 'Перенести'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
