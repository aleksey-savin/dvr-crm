import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  addRefusalReason,
  updateRefusalReason,
} from '@/components/refusal-reasons/actions'
import type { SelectRefusalReason } from '@/db/types'
import type { RefusalReasonEntity } from '@/types'

const ENTITY_OPTIONS: Array<{ value: RefusalReasonEntity; label: string }> = [
  { value: 'lead', label: 'Лиды' },
  { value: 'tender', label: 'Тендеры' },
  { value: 'signal', label: 'Сигналы' },
]

const formSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  entityTypes: z
    .array(z.enum(['lead', 'tender', 'signal']))
    .min(1, 'Выберите хотя бы одну сущность'),
})

export function RefusalReasonForm({
  item,
  onSuccess,
}: {
  item?: SelectRefusalReason
  onSuccess?: () => void
}) {
  const form = useForm({
    defaultValues: {
      name: item?.name ?? '',
      entityTypes: (item?.entityTypes as RefusalReasonEntity[] | undefined) ?? [
        'lead',
        'tender',
        'signal',
      ],
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (item) {
          await updateRefusalReason({ data: { id: item.id, ...value } })
          toast.success('Причина отказа изменена')
        } else {
          await addRefusalReason({ data: value })
          toast.success('Причина отказа создана')
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
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.Field
        name="name"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Наименование</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={isInvalid}
                placeholder="Например: Нет бюджета"
                autoComplete="off"
                required
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      <form.Field
        name="entityTypes"
        children={(field) => {
          const value = field.state.value
          const toggle = (entity: RefusalReasonEntity, checked: boolean) => {
            field.handleChange(
              checked ? [...value, entity] : value.filter((v) => v !== entity),
            )
          }
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel>Применимо к</FieldLabel>
              <div className="flex flex-col gap-2">
                {ENTITY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={value.includes(opt.value)}
                      onCheckedChange={(c) => toggle(opt.value, c === true)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      <div className="flex justify-end">
        <Button type="submit">{item ? 'Сохранить' : 'Создать'}</Button>
      </div>
    </form>
  )
}
