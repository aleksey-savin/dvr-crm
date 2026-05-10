import { createFileRoute } from '@tanstack/react-router'
import { fetchMeetings } from '@/components/meetings/actions'

export const Route = createFileRoute('/meetings')({
  component: RouteComponent,
  loader: () => fetchMeetings(),
})

function RouteComponent() {
  return <div>Hello "/meetings"!</div>
}
