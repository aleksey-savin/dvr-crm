import { Button } from '@/components/ui/button'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'

import { TooltipProvider } from '@/components/ui/tooltip'

import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'

import { RichTextEditor } from '@/components/tiptap/rich-text-editor'

import { createServerFn } from '@tanstack/react-start'
import { company } from '@/db/schema'
import { db } from '@/db'
import { eq } from 'drizzle-orm'

import { Input } from '@/components/ui/input'

const formSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  description: z.union([
    z.string().min(2, 'Описание должно содержать минимум 2 символа'),
    z.undefined(),
  ]),
  regionalMarketPosition: z.union([z.string(), z.undefined()]),
  industry: z.union([z.string(), z.undefined()]),
})

const addSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  description: z
    .string()
    .min(2, 'Описание должно содержать минимум 2 символа')
    .optional(),
  regionalMarketPosition: z.string().optional(),
  industry: z.string().optional(),
})

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  description: z
    .string()
    .min(2, 'Описание должно содержать минимум 2 символа')
    .optional(),
  regionalMarketPosition: z.string().optional(),
  industry: z.string().optional(),
})

const addCompany = createServerFn({ method: 'POST' })
  .inputValidator(addSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(company)
      .values({
        name: data.name,
        description: data.description,
        regionalMarketPosition: data.regionalMarketPosition,
        industry: data.industry,
      })
      .returning({ id: company.id })
    return inserted.id
  })

const updateCompany = createServerFn({ method: 'POST' })
  .inputValidator(updateSchema)
  .handler(async ({ data }) => {
    await db
      .update(company)
      .set({
        name: data.name,
        description: data.description,
        regionalMarketPosition: data.regionalMarketPosition,
        industry: data.industry,
      })
      .where(eq(company.id, data.id))
  })

const CompanyForm = ({
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
      regionalMarketPosition: item?.regionalMarketPosition as
        | string
        | undefined,
      industry: item?.industry as string | undefined,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (!item) {
        try {
          await addCompany({
            data: {
              name: value.name,
              description: value.description,
              regionalMarketPosition: value.regionalMarketPosition,
              industry: value.industry,
            },
          })
          toast.success('Компания успешно создана')
          onSuccess?.()
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Произошла ошибка',
          )
        }
      } else {
        try {
          await updateCompany({
            data: {
              id: item.id,
              name: value.name,
              description: value.description,
              regionalMarketPosition: value.regionalMarketPosition,
              industry: value.industry,
            },
          })

          toast.success('Компания успешно изменена')
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
        id="company-form"
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
                  placeholder="Наименование компании"
                  autoComplete="off"
                  type="text"
                  required
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        {/* Regional market position */}
        <form.Field
          name="regionalMarketPosition"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid} className="shrink-0">
                <FieldLabel htmlFor={field.name}>
                  Позиция на региональном рынке
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Позиция компании на региональном рынке"
                  autoComplete="off"
                  type="text"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        {/* Industry */}
        <form.Field
          name="industry"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid} className="shrink-0">
                <FieldLabel htmlFor={field.name}>Отрасль</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(e.target.value || undefined)
                  }
                  aria-invalid={isInvalid}
                  placeholder="Например: нефтегаз, ритейл, строительство…"
                  autoComplete="off"
                  type="text"
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
        <div className="flex justify-end">
          <Button type="submit">{item ? 'Изменить' : 'Создать'}</Button>
        </div>
      </form>
    </TooltipProvider>
  )
}

export default CompanyForm
