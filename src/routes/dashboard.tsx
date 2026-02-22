import { createFileRoute } from '@tanstack/react-router'
import { authMiddleware } from 'utils/middleware'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard"!</div>
}
