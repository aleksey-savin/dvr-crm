import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/mailing-lists')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/mailing-lists"!</div>
}
