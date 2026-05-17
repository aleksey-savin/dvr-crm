import * as React from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import {
  CalendarSyncIcon,
  CheckIcon,
  EyeIcon,
  XIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  cancelMeeting,
  completeMeeting,
} from '@/components/meetings/actions'
import { RescheduleMeetingDialog } from '@/components/meetings/reschedule-meeting-dialog'
import type { MeetingRow, MeetingStatus, MeetingType } from '@/types'

const STATUS_LABELS: Record<MeetingStatus, string> = {
  scheduled: 'Запланирована',
  completed: 'Проведена',
  cancelled: 'Отменена',
  rescheduled: 'Перенесена',
}

const STATUS_VARIANTS: Record<
  MeetingStatus,
  'default' | 'success' | 'destructive' | 'warning'
> = {
  scheduled: 'default',
  completed: 'success',
  cancelled: 'destructive',
  rescheduled: 'warning',
}

const TYPE_LABELS: Record<MeetingType, string> = {
  client: 'Клиентская',
  internal: 'Внутренняя',
}

function MeetingRowItem({ m }: { m: MeetingRow }) {
  const router = useRouter()
  const [isBusy, setIsBusy] = React.useState(false)
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false)

  const handleComplete = async () => {
    setIsBusy(true)
    try {
      await completeMeeting({ data: { id: m.id, summary: null } })
      toast.success('Встреча отмечена как проведённая')
      await router.invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось')
    } finally {
      setIsBusy(false)
    }
  }

  const handleCancel = async () => {
    setIsBusy(true)
    try {
      await cancelMeeting({ data: { id: m.id } })
      toast.success('Встреча отменена')
      await router.invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <li className="flex flex-col gap-1.5 rounded-md border p-2">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium">{m.title}</span>
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              {TYPE_LABELS[m.meetingType]}
            </Badge>
            <Badge
              variant={STATUS_VARIANTS[m.status]}
              className="px-1.5 py-0 text-[10px]"
            >
              {STATUS_LABELS[m.status]}
            </Badge>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {new Date(m.scheduledAt).toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
            {m.organizerName && <span> · {m.organizerName}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {m.status === 'scheduled' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-emerald-600"
                title="Проведена"
                disabled={isBusy}
                onClick={() => void handleComplete()}
              >
                <CheckIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-amber-600"
                title="Перенести"
                disabled={isBusy}
                onClick={() => setRescheduleOpen(true)}
              >
                <CalendarSyncIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                title="Отменить"
                disabled={isBusy}
                onClick={() => void handleCancel()}
              >
                <XIcon className="size-3.5" />
              </Button>
            </>
          )}
          <Button asChild variant="ghost" size="icon" className="size-7">
            <Link to="/meetings/$id/view" params={{ id: m.id }}>
              <EyeIcon className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <RescheduleMeetingDialog
        meetingId={m.id}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onRescheduled={() => router.invalidate()}
      />
    </li>
  )
}

export function InitiativeMeetingsSection({
  meetings,
}: {
  meetings: MeetingRow[]
}) {
  if (meetings.length === 0) return null

  return (
    <ul className="flex flex-col gap-2">
      {meetings.map((m) => (
        <MeetingRowItem key={m.id} m={m} />
      ))}
    </ul>
  )
}
