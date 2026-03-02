import { Button } from '@/components/ui/button'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'

import { TooltipProvider } from '@/components/ui/tooltip'

import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'

import { RichTextEditor } from '@/components/tiptap/rich-text-editor'

import { createServerFn } from '@tanstack/react-start'
import { department } from '@/db/schema'
import { db } from '@/db'
import { eq } from 'drizzle-orm'

import { Input } from '@/components/ui/input'

const formSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  description: z.union([
    z.string().min(2, 'Описание должно содержать минимум 2 символа'),
    z.undefined(),
  ]),
  accentColor: z.string().min(6, 'Цвет должен содержать минимум 6 символов'),
})

const addSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  description: z
    .string()
    .min(2, 'Описание должно содержать минимум 2 символа')
    .optional(),
  accentColor: z.string().min(6, 'Цвет должен содержать минимум 6 символов'),
})

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  description: z
    .string()
    .min(2, 'Описание должно содержать минимум 2 символа')
    .optional(),
  accentColor: z.string().min(6, 'Цвет должен содержать минимум 6 символов'),
})

const addDepartment = createServerFn({ method: 'POST' })
  .inputValidator(addSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(department)
      .values({
        name: data.name,
        description: data.description,
        accentColor: data.accentColor,
      })
      .returning({ id: department.id })
    return inserted.id
  })

const updateDepartment = createServerFn({ method: 'POST' })
  .inputValidator(updateSchema)
  .handler(async ({ data }) => {
    await db
      .update(department)
      .set({
        name: data.name,
        description: data.description,
        accentColor: data.accentColor,
      })
      .where(eq(department.id, data.id))
  })

const DepartmentForm = ({
  item,
  onSuccess,
}: {
  item?: any
  onSuccess?: () => void
}) => {
  const form = useForm({
    defaultValues: {
      name: (item?.name ?? '') as string,
      description: item?.description as string | undefined,
      accentColor: item?.accentColor as string | undefined,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (!item) {
        try {
          await addDepartment({
            data: {
              name: value.name,
              description: value.description,
              accentColor: value.accentColor || '',
            },
          })
          toast.success('Бизнес-юнит успешно создан')
          onSuccess?.()
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Произошла ошибка',
          )
        }
      } else {
        try {
          await updateDepartment({
            data: {
              id: item.id,
              name: value.name,
              description: value.description,
              accentColor: value.accentColor || '',
            },
          })

          toast.success('Бизнес-юнит успешно изменен')
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
    <TooltipProvider>
      <form
        id="department-form"
        className="flex-1 flex flex-col gap-6 min-h-0"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        {/* Name — fixed height */}
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid} className="shrink-0">
                <FieldLabel htmlFor={field.name}>Наименование</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Наименование бизнес-юнита"
                  autoComplete="off"
                  type="text"
                  required
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        {/* Description — grows to fill remaining space, editor scrolls internally */}
        <form.Field
          name="description"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field
                data-invalid={isInvalid}
                className="flex-1 min-h-0 flex flex-col"
              >
                <FieldLabel htmlFor={field.name}>Описание</FieldLabel>
                <RichTextEditor
                  value={field.state.value}
                  onChange={(html) => field.handleChange(html)}
                  className="flex-1 min-h-0 w-full rounded-xl"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="accentColor"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid} className="shrink-0">
                <FieldLabel htmlFor={field.name}>Фоновый цвет</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="#FFFFFF"
                  autoComplete="off"
                  type="text"
                  required
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <div className="flex justify-end">
          <Button type="submit">{item ? 'Изменить' : 'Создать'}</Button>
        </div>
      </form>
    </TooltipProvider>
  )
}

export default DepartmentForm
