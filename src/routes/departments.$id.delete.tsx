import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/departments/$id/delete')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/departments/$id/delete"!</div>
}
