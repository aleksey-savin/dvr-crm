import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/clients/$id/delete')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/clients/$id/delete"!</div>
}
