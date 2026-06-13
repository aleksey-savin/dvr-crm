import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Link, useRouter } from '@tanstack/react-router'
import { ArrowUpDown, CalendarSyncIcon, CheckIcon, XIcon } from 'lucide-react'

import { CancelMeetingDialog } from '@/components/meetings/cancel-meeting-dialog'
import { CompleteMeetingDialog } from '@/components/meetings/complete-meeting-dialog'
import { RescheduleMeetingDialog } from '@/components/meetings/reschedule-meeting-dialog'
import { RescheduledBadge } from '@/components/meetings/rescheduled-badge'
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
  const [completeOpen, setCompleteOpen] = React.useState(false)
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false)
  const [cancelOpen, setCancelOpen] = React.useState(false)

  return (
    <div className="flex items-center justify-end gap-1">
      {meeting.status === 'scheduled' && (
        <>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setCompleteOpen(true)}
          >
            <CheckIcon className="size-3" />
            Проведена
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setRescheduleOpen(true)}
          >
            <CalendarSyncIcon className="size-3" />
            Перенести
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setCancelOpen(true)}
          >
            <XIcon className="size-3" />
            Отмена
          </Button>
        </>
      )}

      <CompleteMeetingDialog
        meetingId={meeting.id}
        initialSummary={meeting.summary}
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        onCompleted={() => router.invalidate()}
      />
      <RescheduleMeetingDialog
        meetingId={meeting.id}
        currentScheduledAt={meeting.scheduledAt}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onRescheduled={() => router.invalidate()}
      />
      <CancelMeetingDialog
        meetingId={meeting.id}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onCancelled={() => router.invalidate()}
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
    cell: ({ row }) => (
      <Link
        to="/meetings/$id/view"
        params={{ id: row.original.id }}
        search={(prev) => prev}
        className="font-medium text-primary hover:underline"
      >
        {row.original.title}
      </Link>
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
      <div className="flex flex-col items-start gap-0.5">
        <Badge variant="outline">{TYPE_LABELS[row.original.meetingType]}</Badge>
        <span className="text-xs text-muted-foreground">
          {row.original.locationType === 'office'
            ? (row.original.meetingRoomName ?? 'Офис')
            : 'У клиента'}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ row }) => (
      <div className="flex flex-col items-start gap-0.5">
        <Badge variant={STATUS_VARIANTS[row.original.status]}>
          {STATUS_LABELS[row.original.status]}
        </Badge>
        <RescheduledBadge
          count={row.original.rescheduleCount}
          className="px-1.5 py-0 text-xs"
        />
      </div>
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
