import * as React from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { CalendarSyncIcon, EditIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { fetchMeeting } from '@/components/meetings/actions'
import { RescheduleMeetingDialog } from '@/components/meetings/reschedule-meeting-dialog'
import type { MeetingStatus, MeetingType } from '@/types'

export const Route = createFileRoute('/meetings_/$id/view')({
  loader: ({ params }) => fetchMeeting({ data: params }),
  component: RouteComponent,
})

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

function InfoField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

function RouteComponent() {
  const meeting = Route.useLoaderData()
  const router = useRouter()
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false)

  const formatDateTime = (d: Date | null | string | undefined) => {
    if (!d) return '—'
    return new Date(d).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{meeting.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANTS[meeting.status]}>
              {STATUS_LABELS[meeting.status]}
            </Badge>
            <Badge variant="outline">{TYPE_LABELS[meeting.meetingType]}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {meeting.status === 'scheduled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRescheduleOpen(true)}
            >
              <CalendarSyncIcon className="mr-1.5 size-4" />
              Перенести
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to="/meetings/$id/update" params={{ id: meeting.id }}>
              <EditIcon className="mr-1.5 size-4" />
              Редактировать
            </Link>
          </Button>
          <Button asChild variant="destructive" size="sm">
            <Link to="/meetings/$id/delete" params={{ id: meeting.id }}>
              <Trash2Icon className="mr-1.5 size-4" />
              Удалить
            </Link>
          </Button>
        </div>
      </div>

      <RescheduleMeetingDialog
        meetingId={meeting.id}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onRescheduled={() => router.invalidate()}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Детали встречи</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <InfoField label="Дата и время">
              {formatDateTime(meeting.scheduledAt)}
            </InfoField>
            <InfoField label="Время окончания">
              {formatDateTime(meeting.endedAt)}
            </InfoField>
            <InfoField label="Компания">
              {meeting.companyName ?? '—'}
            </InfoField>
            <InfoField label="Подразделение">
              {meeting.departmentName ?? '—'}
            </InfoField>
            <InfoField label="Ответственный">
              {meeting.organizerName ?? '—'}
            </InfoField>
            <InfoField label="Создана">
              {new Date(meeting.createdAt).toLocaleDateString('ru-RU')}
            </InfoField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Участники ({meeting.participantCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {meeting.participants.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Наши</p>
                <div className="flex flex-wrap gap-1.5">
                  {meeting.participants.map((p) => (
                    <Badge key={p.userId} variant="secondary">
                      {p.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {meeting.externalParticipants.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-muted-foreground">
                  Клиентская сторона
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {meeting.externalParticipants.map((ep) => (
                    <Badge key={ep.id} variant="outline">
                      {ep.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {meeting.participants.length === 0 &&
              meeting.externalParticipants.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Участники не указаны
                </p>
              )}
          </CardContent>
        </Card>
      </div>

      {meeting.summary && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Саммари</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{meeting.summary}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
