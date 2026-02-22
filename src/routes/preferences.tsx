import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/preferences')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/preferences"!</div>
}
