import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/departments_/$id/view')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/departments_/$id/view"!</div>
}
