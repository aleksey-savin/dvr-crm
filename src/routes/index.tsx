import { createFileRoute, redirect } from '@tanstack/react-router'

// The root path has no page of its own — send users to the dashboard.
// Unauthenticated requests are redirected to /login earlier by authMiddleware.
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})
