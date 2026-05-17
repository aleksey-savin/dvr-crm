import * as React from 'react'
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
import { deletePipeline } from './actions'

type PipelineDeleteDialogProps = {
  pipelineId: string | null
  pipelineName?: string
  onClose: () => void
  onDeleted: () => void | Promise<void>
}

export function PipelineDeleteDialog({
  pipelineId,
  pipelineName,
  onClose,
  onDeleted,
}: PipelineDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    if (!pipelineId) return
    setIsDeleting(true)
    try {
      await deletePipeline({ data: { id: pipelineId } })
      toast.success('Воронка удалена')
      onClose()
      await onDeleted()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось удалить воронку',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog
      open={pipelineId !== null}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить воронку?</AlertDialogTitle>
          <AlertDialogDescription>
            Воронка «{pipelineName}» и все её этапы будут удалены. Инициативы
            останутся, но потеряют привязку к воронке и этапу.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              void handleDelete()
            }}
            disabled={isDeleting}
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
