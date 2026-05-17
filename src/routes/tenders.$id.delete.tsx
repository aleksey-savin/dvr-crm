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
import { fetchTender, softDeleteTender } from '@/components/tenders/actions'

export const Route = createFileRoute('/tenders/$id/delete')({
  loader: ({ params }) => fetchTender({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const tender = Route.useLoaderData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => router.navigate({ to: '/tenders' })

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await softDeleteTender({ data: { id: tender.id } })
      toast.success('Тендер удалён')
      router.invalidate()
      router.navigate({ to: '/tenders' })
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
          <AlertDialogTitle>Удалить тендер?</AlertDialogTitle>
          <AlertDialogDescription>
            Тендер «{tender.title}» будет удалён. Это действие необратимо.
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
