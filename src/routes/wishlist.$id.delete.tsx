import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
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
import {
  deleteWishlistClient,
  fetchWishlistClient,
} from '@/components/accounts/actions'

export const Route = createFileRoute('/wishlist/$id/delete')({
  loader: ({ params }) => fetchWishlistClient({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const item = Route.useLoaderData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    router.navigate({ to: '/wishlist' })
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await deleteWishlistClient({ data: item.id })
      toast.success('Клиент удалён из вишлиста')
      router.invalidate()
      router.navigate({ to: '/wishlist' })
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
          <AlertDialogTitle>Удалить из вишлиста?</AlertDialogTitle>
          <AlertDialogDescription>
            Компания «{item.company.name}» будет удалена из вишлиста без
            возможности восстановления. Все связанные данные (хуки, задачи,
            комментарии) также будут удалены.
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
            {isLoading ? 'Удаление…' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
