import { db } from '@/db'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

const fetch = createServerFn().handler(async () => {
  return await db.query.meeting.findMany()
})

export const Route = createFileRoute('/meetings')({
  component: RouteComponent,
  loader: () => fetch(),
})

function RouteComponent() {
  return <div>Hello "/meetings"!</div>
}
