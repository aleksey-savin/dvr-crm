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
import { deleteIndustry, fetchIndustry } from '@/components/industries/actions'

export const Route = createFileRoute('/industries/$id/delete')({
  loader: ({ params }) => fetchIndustry({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const industry = Route.useLoaderData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    router.navigate({ to: '/industries' })
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await deleteIndustry({ data: industry.id })
      toast.success('Отрасль удалена')
      router.invalidate()
      router.navigate({ to: '/industries' })
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
          <AlertDialogTitle>Удалить отрасль?</AlertDialogTitle>
          <AlertDialogDescription>
            Отрасль «{industry.name}» будет удалена. У компаний с этой отраслью
            значение будет очищено.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={handleClose}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isLoading}
            onClick={(event) => {
              event.preventDefault()
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
