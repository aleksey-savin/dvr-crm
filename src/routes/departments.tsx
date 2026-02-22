import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/departments')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/departments"!</div>
}
