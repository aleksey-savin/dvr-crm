import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/my-company_/$id/view')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/my-company_/$id/view"!</div>
}
