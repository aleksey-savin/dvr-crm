import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PipelineWithStages } from '@/types'

type ConvertToInitiativeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pipelines: PipelineWithStages[]
  title: string
  description: string
  onConvert: (args: {
    pipelineId: string
    stageId: string
  }) => Promise<{ id: string }>
  onSuccess: (initiativeId: string) => void
}

function firstStageOf(pipeline: PipelineWithStages | undefined) {
  if (!pipeline) return undefined
  // pipeline.stages is already ordered by `order` from fetchPipelines, but
  // sort defensively to be safe regardless of fetch ordering.
  return [...pipeline.stages].sort((a, b) => a.order - b.order)[0]
}

export function ConvertToInitiativeDialog({
  open,
  onOpenChange,
  pipelines,
  title,
  description,
  onConvert,
  onSuccess,
}: ConvertToInitiativeDialogProps) {
  const [pipelineId, setPipelineId] = React.useState<string>(
    pipelines[0]?.id ?? '',
  )
  const [isLoading, setIsLoading] = React.useState(false)

  // If pipelines change while dialog is closed and reopen, reset selection.
  const effectivePipelineId =
    pipelines.find((p) => p.id === pipelineId)?.id ?? pipelines.at(0)?.id ?? ''
  const selectedPipeline = pipelines.find((p) => p.id === effectivePipelineId)
  const firstStage = firstStageOf(selectedPipeline)

  const handleConvert = async () => {
    if (!selectedPipeline || !firstStage) return
    setIsLoading(true)
    try {
      const result = await onConvert({
        pipelineId: selectedPipeline.id,
        stageId: firstStage.id,
      })
      onSuccess(result.id)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось конвертировать',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {pipelines.length === 0 ? (
          <p className="text-sm text-destructive">
            Нет ни одной воронки продаж. Сначала создайте воронку на странице
            «Инициативы».
          </p>
        ) : (
          <div className="space-y-3">
            {pipelines.length > 1 ? (
              <Field>
                <FieldLabel>Воронка</FieldLabel>
                <Select
                  value={effectivePipelineId}
                  onValueChange={setPipelineId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : (
              <p className="text-sm">
                Воронка:{' '}
                <span className="font-medium">{selectedPipeline?.name}</span>
              </p>
            )}

            {firstStage ? (
              <p className="text-sm text-muted-foreground">
                Будет добавлено на первый этап:{' '}
                <span className="font-medium text-foreground">
                  {firstStage.name}
                </span>
              </p>
            ) : (
              <p className="text-sm text-destructive">
                В выбранной воронке нет этапов.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault()
              void handleConvert()
            }}
            disabled={isLoading || pipelines.length === 0 || !firstStage}
          >
            {isLoading ? 'Создание...' : 'Создать инициативу'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
