import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/companies_/$id/view')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/company_/$id/view"!</div>
}
