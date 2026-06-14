import { createFileRoute, useRouter } from '@tanstack/react-router'
import { InitiativeForm } from '@/components/initiatives/initiative-form'
import {
  fetchInitiative,
  fetchInitiativeFormOptions,
} from '@/components/initiatives/actions'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/initiatives/$id/update')({
  loader: ({ params }) =>
    Promise.all([
      fetchInitiative({ data: { id: params.id } }),
      fetchInitiativeFormOptions(),
    ]),
  component: RouteComponent,
})

function RouteComponent() {
  const [item, options] = Route.useLoaderData()
  const router = useRouter()

  const handleClose = () =>
    router.navigate({ to: '/initiatives/$id/view', params: { id: item.id } })
  const handleSuccess = () => {
    router.invalidate()
    handleClose()
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Редактировать инициативу"
      description={item.title}
      contentClassName="sm:max-w-2xl"
    >
      <InitiativeForm
        item={item as any}
        options={options}
        onSuccess={handleSuccess}
      />
    </ResponsiveDialog>
  )
}
