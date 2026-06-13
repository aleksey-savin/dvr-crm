import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteSalesPlan, fetchSalesPlans } from '@/components/reports/actions'

const SEGMENT_LABEL = { target: 'Целевые', nontarget: 'Нецелевые' } as const

export const Route = createFileRoute('/sales-plans/$id/delete')({
  loader: async ({ params }) => {
    const plans = await fetchSalesPlans({ data: {} })
    const plan = plans.find((p) => p.id === params.id)
    if (!plan) throw new Error('План не найден')
    return plan
  },
  component: RouteComponent,
})

function RouteComponent() {
  const plan = Route.useLoaderData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => router.navigate({ to: '/sales-plans' })

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await deleteSalesPlan({ data: { id: plan.id } })
      toast.success('План удалён')
      router.invalidate()
      router.navigate({ to: '/sales-plans' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить план?</AlertDialogTitle>
          <AlertDialogDescription>
            План «{plan.userName} · {plan.year} · {SEGMENT_LABEL[plan.segment]}»
            будет удалён. Это действие необратимо.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={handleClose}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault()
              void handleConfirm()
            }}
          >
            {isLoading ? 'Удаление...' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
