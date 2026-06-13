import { createFileRoute, useRouter } from '@tanstack/react-router'
import { fetchMeeting } from '@/components/meetings/actions'
import { MeetingForm } from '@/components/meetings/meeting-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

type CopyMeetingSearch = {
  /** Сквозные параметры представления страницы встреч — для возврата. */
  view?: 'calendar'
  week?: string
  cal?: 'day' | 'month'
}

export const Route = createFileRoute('/meetings/$id/copy')({
  validateSearch: (search: Record<string, unknown>): CopyMeetingSearch => ({
    view: search.view === 'calendar' ? 'calendar' : undefined,
    week: typeof search.week === 'string' ? search.week : undefined,
    cal:
      search.cal === 'day' || search.cal === 'month' ? search.cal : undefined,
  }),
  loader: ({ params }) => fetchMeeting({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const meeting = Route.useLoaderData()
  const { view, week, cal } = Route.useSearch()

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
      title="Копия встречи"
      description="Создание встречи на основе существующей"
      contentClassName="sm:max-w-2xl"
    >
      <MeetingForm copyFrom={meeting} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
