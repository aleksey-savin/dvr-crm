import DepartmentForm from '@/components/departments/department-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { createFileRoute, useRouter } from '@tanstack/react-router'

type MyCompanyTab = 'employees' | 'structure'

export const Route = createFileRoute('/my-company/new')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { parentId?: string; tab?: MyCompanyTab } => {
    return {
      parentId:
        typeof search.parentId === 'string' ? search.parentId : undefined,
      tab:
        search.tab === 'employees' || search.tab === 'structure'
          ? search.tab
          : undefined,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const { parentId } = Route.useSearch()

  const handleClose = () => {
    router.navigate({ to: '/my-company', search: { tab: 'structure' } })
  }

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/my-company', search: { tab: 'structure' } })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Новое подразделение"
      description="Создание нового подразделения"
    >
      <DepartmentForm onSuccess={handleSuccess} initialParentId={parentId} />
    </ResponsiveDialog>
  )
}
