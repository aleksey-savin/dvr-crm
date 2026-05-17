import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { addSource, updateSource } from '@/components/sources/actions'
import type { SelectSource } from '@/db/types'

const formSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
})

export function SourceForm({
  item,
  onSuccess,
}: {
  item?: SelectSource
  onSuccess?: () => void
}) {
  const form = useForm({
    defaultValues: {
      name: item?.name ?? '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (item) {
          await updateSource({ data: { id: item.id, name: value.name } })
          toast.success('Источник изменён')
        } else {
          await addSource({ data: { name: value.name } })
          toast.success('Источник создан')
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
                placeholder="Например: Сайт"
                autoComplete="off"
                required
              />
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
