import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/meeting-room-booking')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/meeting-room-booking"!</div>
}
