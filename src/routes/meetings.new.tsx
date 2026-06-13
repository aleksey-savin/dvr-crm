import { createFileRoute, useRouter } from '@tanstack/react-router'
import { MeetingForm } from '@/components/meetings/meeting-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

type NewMeetingSearch = {
  /** Предзаполнение из календаря: слот и переговорка. */
  room?: string
  start?: string
  /** Сквозные параметры представления страницы встреч — для возврата. */
  view?: 'calendar'
  week?: string
  cal?: 'day' | 'month'
}

export const Route = createFileRoute('/meetings/new')({
  validateSearch: (search: Record<string, unknown>): NewMeetingSearch => ({
    room: typeof search.room === 'string' ? search.room : undefined,
    start: typeof search.start === 'string' ? search.start : undefined,
    view: search.view === 'calendar' ? 'calendar' : undefined,
    week: typeof search.week === 'string' ? search.week : undefined,
    cal:
      search.cal === 'day' || search.cal === 'month' ? search.cal : undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const { room, start, view, week, cal } = Route.useSearch()

  // Возврат в то представление, откуда открыли форму (таблица или календарь).
  const backSearch = { view, week, cal }

  const handleClose = () =>
    router.navigate({ to: '/meetings', search: backSearch })

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/meetings', search: backSearch })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Новая встреча"
      description="Создание новой встречи"
      contentClassName="sm:max-w-2xl"
    >
      <MeetingForm
        presetMeetingRoomId={room ?? null}
        presetScheduledAt={start ?? null}
        onSuccess={handleSuccess}
      />
    </ResponsiveDialog>
  )
}
