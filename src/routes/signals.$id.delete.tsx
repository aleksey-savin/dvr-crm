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
import { fetchSignal, softDeleteSignal } from '@/components/signals/actions'

export const Route = createFileRoute('/signals/$id/delete')({
  loader: ({ params }) => fetchSignal({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const signal = Route.useLoaderData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => router.navigate({ to: '/signals' })

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await softDeleteSignal({ data: { id: signal.id } })
      toast.success('Сигнал удалён')
      router.invalidate()
      router.navigate({ to: '/signals' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) handleClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить сигнал?</AlertDialogTitle>
          <AlertDialogDescription>
            Сигнал «{signal.title}» будет удалён. Это действие необратимо.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={handleClose}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isLoading}
            onClick={(e) => { e.preventDefault(); handleConfirm() }}
          >
            {isLoading ? 'Удаление...' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
