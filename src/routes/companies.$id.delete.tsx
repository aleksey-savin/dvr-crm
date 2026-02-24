import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { company } from '@/db/schema'

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

const fetchCompany = createServerFn()
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    return db.query.company.findFirst({ where: eq(company.id, id) })
  })

const deleteCompany = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.delete(company).where(eq(company.id, id))
  })

export const Route = createFileRoute('/companies/$id/delete')({
  loader: ({ params }) => fetchCompany({ data: params.id }),
  component: RouteComponent,
})

function RouteComponent() {
  const company = Route.useLoaderData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    router.navigate({ to: '/companies' })
  }

  const handleConfirm = async () => {
    if (!company) return
    setIsLoading(true)
    try {
      await deleteCompany({ data: company.id })
      toast.success('Компания удалена')
      router.invalidate()
      router.navigate({ to: '/companies' })
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
          <AlertDialogTitle>Удалить бизнес-юнит?</AlertDialogTitle>
          <AlertDialogDescription>
            Бизнес-юнит «{company?.name}» будет удален без возможности
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
