import { Button } from '@/components/ui/button'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'

import { TooltipProvider } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import * as React from 'react'

import { RichTextEditor } from '@/components/tiptap/rich-text-editor'

import { Input } from '@/components/ui/input'
import { addCompany, updateCompany } from '@/components/companies/actions'
import { fetchIndustries } from '@/components/industries/actions'
import type { SelectCompany } from '@/db/types'

const NO_SCOPE_VALUE = '__no_scope__'
const NO_INDUSTRY_VALUE = '__no_industry__'

const formSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  scope: z.union([z.enum(['federal', 'regional']), z.undefined()]),
  website: z.union([z.string(), z.undefined()]),
  description: z.union([
    z.string().min(2, 'Описание должно содержать минимум 2 символа'),
    z.undefined(),
  ]),
  regionalMarketPosition: z.union([z.string(), z.undefined()]),
  industryId: z.union([z.string(), z.undefined()]),
})

type IndustryOption = {
  id: string
  name: string
}

type CompanyFormItem = SelectCompany & {
  industryRef?: IndustryOption | null
}

const CompanyForm = ({
  item,
  onSuccess,
}: {
  item?: CompanyFormItem
  onSuccess?: () => void
}) => {
  const [industries, setIndustries] = React.useState<IndustryOption[]>([])
  const [industriesLoading, setIndustriesLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    setIndustriesLoading(true)
    fetchIndustries()
      .then((rows) => {
        if (!cancelled) setIndustries(rows)
      })
      .catch(() => {
        if (!cancelled) toast.error('Не удалось загрузить отрасли')
      })
      .finally(() => {
        if (!cancelled) setIndustriesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const form = useForm({
    defaultValues: {
      name: item?.name ?? '',
      scope: (item?.scope ?? undefined) as 'federal' | 'regional' | undefined,
      website: item?.website as string | undefined,
      description: item?.description as string | undefined,
      regionalMarketPosition: item?.regionalMarketPosition as
        | string
        | undefined,
      industryId: item?.industryId ?? undefined,
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
              scope: value.scope,
              website: value.website,
              description: value.description,
              regionalMarketPosition: value.regionalMarketPosition,
              industryId: value.industryId,
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
              scope: value.scope,
              website: value.website,
              description: value.description,
              regionalMarketPosition: value.regionalMarketPosition,
              industryId: value.industryId,
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
        className="flex flex-col gap-6"
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
        {/* Scope */}
        <form.Field
          name="scope"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid} className="shrink-0">
                <FieldLabel htmlFor={field.name}>Масштаб</FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value ?? NO_SCOPE_VALUE}
                  onValueChange={(value) =>
                    field.handleChange(
                      value === NO_SCOPE_VALUE
                        ? undefined
                        : (value as 'federal' | 'regional'),
                    )
                  }
                >
                  <SelectTrigger
                    id={field.name}
                    className="w-full"
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                  >
                    <SelectValue placeholder="Не указан" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SCOPE_VALUE}>Не указан</SelectItem>
                    <SelectItem value="federal">Федеральная</SelectItem>
                    <SelectItem value="regional">Региональная</SelectItem>
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        {/* Website */}
        <form.Field
          name="website"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid} className="shrink-0">
                <FieldLabel htmlFor={field.name}>Веб-сайт</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="https://example.com"
                  autoComplete="off"
                  type="url"
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
          name="industryId"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid} className="shrink-0">
                <FieldLabel htmlFor={field.name}>Отрасль</FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value ?? NO_INDUSTRY_VALUE}
                  onValueChange={(value) =>
                    field.handleChange(
                      value === NO_INDUSTRY_VALUE ? undefined : value,
                    )
                  }
                  disabled={industriesLoading}
                >
                  <SelectTrigger
                    id={field.name}
                    className="w-full"
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                  >
                    <SelectValue
                      placeholder={
                        industriesLoading ? 'Загрузка...' : 'Выберите отрасль'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_INDUSTRY_VALUE}>
                      Не указана
                    </SelectItem>
                    {industries.map((industry) => (
                      <SelectItem key={industry.id} value={industry.id}>
                        {industry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                className="flex flex-col"
              >
                <FieldLabel htmlFor={field.name}>Описание</FieldLabel>
                <RichTextEditor
                  value={field.state.value}
                  onChange={(html) => field.handleChange(html)}
                  className="min-h-[200px] w-full rounded-xl"
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
