import { Button } from '@/components/ui/button'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'

import { TooltipProvider } from '@/components/ui/tooltip'

import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'

import { RichTextEditor } from '@/components/tiptap/rich-text-editor'

import { Input } from '@/components/ui/input'
import { addCompany, updateCompany } from '@/components/companies/actions'
import type { SelectCompany } from '@/db/types'

const formSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  description: z.union([
    z.string().min(2, 'Описание должно содержать минимум 2 символа'),
    z.undefined(),
  ]),
  regionalMarketPosition: z.union([z.string(), z.undefined()]),
  industry: z.union([z.string(), z.undefined()]),
})

const CompanyForm = ({
  item,
  onSuccess,
}: {
  item?: SelectCompany
  onSuccess?: () => void
}) => {
  const form = useForm({
    defaultValues: {
      name: (item?.name ?? ''),
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
