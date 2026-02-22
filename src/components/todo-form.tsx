import { Button } from '@/components/ui/button'

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'

import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { Textarea } from './ui/textarea'
import { createServerFn } from '@tanstack/react-start'
import { todos } from '@/db/schema'
import { db } from '@/db'
import { eq } from 'drizzle-orm'

const addSchema = z.object({
  name: z.string().min(2, 'Задача должна содержать минимум 2 символа'),
})

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Задача должна содержать минимум 2 символа'),
})

const addTodo = createServerFn({ method: 'POST' })
  .inputValidator(addSchema)
  .handler(async ({ data }) => {
    await db.insert(todos).values({ name: data.name })
  })

const updateTodo = createServerFn({ method: 'POST' })
  .inputValidator(updateSchema)
  .handler(async ({ data }) => {
    await db.update(todos).set({ name: data.name }).where(eq(todos.id, data.id))
  })

const TodoForm = ({
  item,
  onSuccess,
}: {
  item?: any
  onSuccess?: () => void
}) => {
  const form = useForm({
    defaultValues: {
      name: item ? item.name : '',
    },
    validators: {
      onSubmit: addSchema,
    },
    onSubmit: async ({ value }) => {
      if (!item) {
        try {
          await addTodo({ data: value })
          toast.success('Задача успешно создана')
          onSuccess?.()
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Произошла ошибка',
          )
        }
      } else {
        try {
          await updateTodo({ data: { name: value.name, id: item.id } })
          toast.success('Задача успешно изменена')
          onSuccess?.()
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Произошла ошибка',
          )
        }
      }
    },
  })

  return (
    <form
      id="todo-form"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Описание</FieldLabel>
                <Textarea
                  autoFocus
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Опишите задачу"
                  autoComplete="off"
                  required
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <Field>
          <Button type="submit">{item ? 'Изменить' : 'Создать'}</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

export default TodoForm
