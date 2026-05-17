import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Link, useRouter } from '@tanstack/react-router'
import {
  ArrowUpDown,
  CalendarSyncIcon,
  CheckIcon,
  EditIcon,
  EyeIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { completeMeeting, cancelMeeting } from '@/components/meetings/actions'
import { RescheduleMeetingDialog } from '@/components/meetings/reschedule-meeting-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { MeetingRow, MeetingStatus, MeetingType } from '@/types'

const STATUS_LABELS: Record<MeetingStatus, string> = {
  scheduled: 'Запланирована',
  completed: 'Проведена',
  cancelled: 'Отменена',
  rescheduled: 'Перенесена',
}

const STATUS_VARIANTS: Record<
  MeetingStatus,
  'secondary' | 'default' | 'success' | 'destructive' | 'warning'
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

function MeetingActions({ meeting }: { meeting: MeetingRow }) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false)

  const handleComplete = async () => {
    setIsPending(true)
    try {
      await completeMeeting({ data: { id: meeting.id, summary: null } })
      toast.success('Встреча отмечена как проведённая')
      await router.invalidate()
    } catch {
      toast.error('Не удалось обновить встречу')
    } finally {
      setIsPending(false)
    }
  }

  const handleCancel = async () => {
    setIsPending(true)
    try {
      await cancelMeeting({ data: { id: meeting.id } })
      toast.success('Встреча отменена')
      await router.invalidate()
    } catch {
      toast.error('Не удалось отменить встречу')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {meeting.status === 'scheduled' && (
        <>
          <Button
            variant="outline"
            size="xs"
            disabled={isPending}
            onClick={() => void handleComplete()}
          >
            <CheckIcon className="size-3" />
            Проведена
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={isPending}
            onClick={() => setRescheduleOpen(true)}
          >
            <CalendarSyncIcon className="size-3" />
            Перенести
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={isPending}
            onClick={() => void handleCancel()}
          >
            <XIcon className="size-3" />
            Отмена
          </Button>
        </>
      )}
      <Button asChild variant="ghost" size="icon-sm">
        <Link to="/meetings/$id/view" params={{ id: meeting.id }}>
          <EyeIcon className="size-4" />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon-sm">
        <Link to="/meetings/$id/update" params={{ id: meeting.id }}>
          <EditIcon className="size-4" />
        </Link>
      </Button>
      <Button asChild variant="destructiveGhost" size="icon-sm">
        <Link to="/meetings/$id/delete" params={{ id: meeting.id }}>
          <Trash2Icon className="size-4" />
        </Link>
      </Button>

      <RescheduleMeetingDialog
        meetingId={meeting.id}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onRescheduled={() => router.invalidate()}
      />
    </div>
  )
}

export const columns: ColumnDef<MeetingRow>[] = [
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
  },
  {
    accessorKey: 'companyName',
    header: 'Компания',
    cell: ({ row }) =>
      row.original.companyName ?? (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'meetingType',
    header: 'Тип',
    cell: ({ row }) => (
      <Badge variant="outline">{TYPE_LABELS[row.original.meetingType]}</Badge>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.status]}>
        {STATUS_LABELS[row.original.status]}
      </Badge>
    ),
  },
  {
    accessorKey: 'scheduledAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Дата <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) =>
      new Date(row.original.scheduledAt).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
  },
  {
    accessorKey: 'organizerName',
    header: 'Ответственный',
    cell: ({ row }) =>
      row.original.organizerName ?? (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'departmentName',
    header: 'Подразделение',
    cell: ({ row }) =>
      row.original.departmentName ?? (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'participantCount',
    header: 'Участников',
    cell: ({ row }) => row.original.participantCount,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Создана <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString('ru-RU'),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <MeetingActions meeting={row.original} />,
  },
]
