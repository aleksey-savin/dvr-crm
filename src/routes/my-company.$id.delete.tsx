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
  deleteDepartment,
  fetchDepartment,
} from '@/components/departments/actions'

export const Route = createFileRoute('/my-company/$id/delete')({
  loader: ({ params }) => fetchDepartment({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const departmentItem = Route.useLoaderData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    router.navigate({ to: '/my-company', search: { tab: 'structure' } })
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await deleteDepartment({ data: departmentItem.id })
      toast.success('Подразделение удалено')
      router.invalidate()
      router.navigate({ to: '/my-company', search: { tab: 'structure' } })
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
          <AlertDialogTitle>Удалить подразделение?</AlertDialogTitle>
          <AlertDialogDescription>
            Подразделение «{departmentItem.name}» будет удалено без возможности
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
