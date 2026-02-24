import ClientForm from '@/components/client-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { db } from '@/db'
import { client } from '@/db/schema'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

const fetchClient = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const task = await db.query.client.findFirst({
      where: eq(client.id, data.id),
    })

    if (task === null) throw notFound()
    return task
  })

export const Route = createFileRoute('/clients/$id/update')({
  component: RouteComponent,
  loader: async ({ params }) => fetchClient({ data: params }),
})

function RouteComponent() {
  const router = useRouter()

  const client = Route.useLoaderData()

  const handleClose = () => {
    router.history.back()
  }

  const handleSuccess = () => {
    router.invalidate()
    router.history.back()
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Изменить клиента"
      description="Изменение клиента"
    >
      <ClientForm onSuccess={handleSuccess} item={client} />
    </ResponsiveDialog>
  )
}
