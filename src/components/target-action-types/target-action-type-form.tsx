import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  addTargetActionType,
  updateTargetActionType,
} from '@/components/target-action-types/actions'
import type { TargetActionTypeRow } from '@/types'

const formSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  isPlannable: z.boolean(),
})

export function TargetActionTypeForm({
  item,
  onSuccess,
}: {
  item?: TargetActionTypeRow
  onSuccess?: () => void
}) {
  const form = useForm({
    defaultValues: {
      name: item?.name ?? '',
      isPlannable: item?.isPlannable ?? true,
    },
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      try {
        if (item) {
          await updateTargetActionType({
            data: {
              id: item.id,
              name: value.name,
              isPlannable: value.isPlannable,
            },
          })
          toast.success('Тип ЦД обновлён')
        } else {
          await addTargetActionType({
            data: { name: value.name, isPlannable: value.isPlannable },
          })
          toast.success('Тип ЦД создан')
        }
        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
      }
    },
  })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.Field name="name">
        {(field) => (
          <Field
            data-invalid={
              field.state.meta.isTouched && !field.state.meta.isValid
            }
          >
            <FieldLabel htmlFor={field.name}>Название *</FieldLabel>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Название типа целевого действия"
            />
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <form.Field name="isPlannable">
        {(field) => (
          <Field>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={field.state.value}
                onCheckedChange={(v) => field.handleChange(v === true)}
              />
              Учитывать в плане
            </label>
            <p className="text-sm text-muted-foreground">
              Отключите для KPI, которые никто не планирует (например, перенос
              встречи): в отчёте такой тип показывается только количеством, без
              плана и процентов.
            </p>
          </Field>
        )}
      </form.Field>

      <div className="flex justify-end border-t pt-4">
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : item ? 'Сохранить' : 'Создать'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
