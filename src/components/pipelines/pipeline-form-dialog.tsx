import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { PipelineForm } from './pipeline-form'
import type { PipelineWithStages } from '@/types'

type PipelineFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pipeline?: PipelineWithStages
  departmentOptions: Array<{ id: string; name: string }>
  onSuccess: (newId?: string) => void
}

export function PipelineFormDialog({
  open,
  onOpenChange,
  pipeline,
  departmentOptions,
  onSuccess,
}: PipelineFormDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={pipeline ? 'Редактировать воронку' : 'Новая воронка'}
      description={
        pipeline
          ? 'Измените этапы, цвета и привязку к подразделениям'
          : 'Настройте этапы и привязку к подразделениям'
      }
      contentClassName="sm:max-w-3xl"
    >
      <PipelineForm
        item={pipeline}
        departmentOptions={departmentOptions}
        onSuccess={onSuccess}
      />
    </ResponsiveDialog>
  )
}
