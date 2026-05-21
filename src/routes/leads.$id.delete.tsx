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
import { fetchLead, softDeleteLead } from '@/components/leads/actions'

export const Route = createFileRoute('/leads/$id/delete')({
  loader: ({ params }) => fetchLead({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const lead = Route.useLoaderData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () =>
    router.navigate({ to: '/sources', search: { tab: 'leads' } })

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await softDeleteLead({ data: { id: lead.id } })
      toast.success('Лид удалён')
      router.invalidate()
      router.navigate({ to: '/sources', search: { tab: 'leads' } })
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
          <AlertDialogTitle>Удалить лид?</AlertDialogTitle>
          <AlertDialogDescription>
            Лид «{lead.title}» будет удалён. Это действие необратимо.
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
              handleConfirm()
            }}
          >
            {isLoading ? 'Удаление...' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
