import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { wishlistClient } from '@/db/schema'

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

const fetchWishlistClient = createServerFn()
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    return db.query.wishlistClient.findFirst({
      where: eq(wishlistClient.id, id),
      with: { company: { columns: { name: true } } },
    })
  })

const deleteWishlistClient = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.delete(wishlistClient).where(eq(wishlistClient.id, id))
  })

export const Route = createFileRoute('/wishlist/$id/delete')({
  loader: ({ params }) => fetchWishlistClient({ data: params.id }),
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
    if (!item) return
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
            Компания «{item?.company.name}» будет удалена из вишлиста без
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
