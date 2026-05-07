import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { companyAccount } from '@/db/schema'

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

const fetchClient = createServerFn()
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    return db.query.companyAccount.findFirst({
      where: eq(companyAccount.id, id),
      with: {
        company: { columns: { name: true } },
      },
    })
  })

const deleteClient = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.delete(companyAccount).where(eq(companyAccount.id, id))
  })

export const Route = createFileRoute('/clients/$id/delete')({
  loader: ({ params }) => fetchClient({ data: params.id }),
  component: RouteComponent,
})

function RouteComponent() {
  const clientData = Route.useLoaderData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    router.navigate({ to: '/clients' })
  }

  const handleConfirm = async () => {
    if (!clientData) return
    setIsLoading(true)
    try {
      await deleteClient({ data: clientData.id })
      toast.success('Клиент удалён')
      router.invalidate()
      router.navigate({ to: '/clients' })
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
          <AlertDialogTitle>Удалить клиента?</AlertDialogTitle>
          <AlertDialogDescription>
            Клиент «{clientData?.company.name}» будет удалён без возможности
            восстановления. Это действие необратимо.
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
