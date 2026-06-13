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
import { completeMeeting } from '@/components/meetings/actions'

type Props = {
  meetingId: string
  /** Уже сохранённый результат — предзаполняется при открытии из просмотра. */
  initialSummary?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted?: () => void
}

export function CompleteMeetingDialog({
  meetingId,
  initialSummary = null,
  open,
  onOpenChange,
  onCompleted,
}: Props) {
  const [summary, setSummary] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) setSummary(initialSummary ?? '')
  }, [open, initialSummary])

  const handleSubmit = async () => {
    if (!summary.trim()) {
      toast.error('Укажите результат встречи')
      return
    }
    setIsSubmitting(true)
    try {
      await completeMeeting({
        data: { id: meetingId, summary: summary.trim() },
      })
      toast.success('Встреча отмечена как проведённая')
      onOpenChange(false)
      onCompleted?.()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Не удалось обновить встречу',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Встреча проведена</DialogTitle>
          <DialogDescription>
            Зафиксируйте результат — он сохранится в карточке встречи, а сама
            встреча попадёт в целевые действия.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel>Результат встречи *</FieldLabel>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Договорённости, итоги, следующие шаги"
            rows={4}
            disabled={isSubmitting}
          />
        </Field>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : 'Проведена'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
