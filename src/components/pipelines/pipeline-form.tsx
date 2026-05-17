import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Checkbox } from '@/components/ui/checkbox'
import { addPipeline, updatePipeline } from './actions'
import type { PipelineWithStages } from '@/types'

type PipelineFormProps = {
  item?: PipelineWithStages
  departmentOptions: Array<{ id: string; name: string }>
  onSuccess?: (newId?: string) => void
}

// Pipeline metadata only — stages are managed inline on the kanban board.
export function PipelineForm({
  item,
  departmentOptions,
  onSuccess,
}: PipelineFormProps) {
  const form = useForm({
    defaultValues: {
      name: item?.name ?? '',
      description: item?.description ?? '',
      departmentIds: item?.departmentIds ?? [],
    },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          name: value.name,
          description: value.description || null,
          departmentIds: value.departmentIds,
          // Preserve existing stages — pass them so updatePipeline upserts
          // by id and leaves them untouched. For new pipelines, no stages.
          stages: (item?.stages ?? []).map((s, idx) => ({
            id: s.id,
            name: s.name,
            color: s.color,
            order: idx,
            isWon: s.isWon,
            isLost: s.isLost,
          })),
        }

        if (item) {
          await updatePipeline({ data: { id: item.id, ...payload } })
          toast.success('Воронка обновлена')
          onSuccess?.()
        } else {
          const result = await addPipeline({ data: payload })
          toast.success('Воронка создана')
          onSuccess?.(result.id)
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Произошла ошибка',
        )
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.Field name="name">
        {(field) => (
          <Field
            data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
          >
            <FieldLabel htmlFor={field.name}>Название *</FieldLabel>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Воронка продаж"
            />
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Описание</FieldLabel>
            <Textarea
              id={field.name}
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Необязательное описание..."
              rows={2}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="departmentIds">
        {(field) => (
          <Field>
            <FieldLabel>Подразделения</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {departmentOptions.map((dept) => {
                const checked = field.state.value.includes(dept.id)
                return (
                  <label
                    key={dept.id}
                    className="flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        if (v) {
                          field.handleChange([...field.state.value, dept.id])
                        } else {
                          field.handleChange(
                            field.state.value.filter((id) => id !== dept.id),
                          )
                        }
                      }}
                    />
                    {dept.name}
                  </label>
                )
              })}
            </div>
          </Field>
        )}
      </form.Field>

      <p className="text-xs text-muted-foreground">
        Этапы воронки создаются и редактируются прямо на канбан-доске:
        кнопкой «+ Создать колонку» и меню «⋮» в заголовке колонки.
      </p>

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting
              ? 'Сохранение...'
              : item
                ? 'Сохранить изменения'
                : 'Создать воронку'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
