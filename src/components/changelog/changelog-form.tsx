import * as React from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { appVersion } from '@/lib/app-version'

import {
  addChangelogRelease,
  updateChangelogRelease,
} from '@/components/changelog/actions'
import { RichTextEditor } from '@/components/tiptap/rich-text-editor'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { ChangelogReleaseRow, ChangelogStatus } from '@/types'

const formSchema = z.object({
  version: z.string().min(1, 'Укажите версию').max(40),
  title: z.string().min(2, 'Заголовок слишком короткий').max(160),
  summary: z.string().max(500),
  content: z.string().min(1, 'Добавьте список изменений'),
  status: z.enum(['draft', 'published']),
  publishedAt: z.string(),
})

function formatDateInput(value: Date | string | null | undefined) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function ChangelogForm({
  item,
  onSuccess,
}: {
  item?: ChangelogReleaseRow
  onSuccess?: () => void
}) {
  const [selectedStatus, setSelectedStatus] = React.useState<ChangelogStatus>(
    item?.status ?? 'draft',
  )

  const form = useForm({
    defaultValues: {
      version: item?.version ?? '',
      title: item?.title ?? '',
      summary: item?.summary ?? '',
      content: item?.content ?? '',
      status: item?.status ?? ('draft' as ChangelogStatus),
      publishedAt: formatDateInput(item?.publishedAt ?? new Date()),
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (item) {
          await updateChangelogRelease({
            data: {
              id: item.id,
              version: value.version,
              title: value.title,
              summary: value.summary,
              content: value.content,
              status: value.status,
              publishedAt: value.publishedAt,
            },
          })
          toast.success('Релиз изменен')
        } else {
          await addChangelogRelease({
            data: {
              version: value.version,
              title: value.title,
              summary: value.summary,
              content: value.content,
              status: value.status,
              publishedAt: value.publishedAt,
            },
          })
          toast.success('Релиз создан')
        }

        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
      }
    },
  })

  return (
    <TooltipProvider>
      <form
        id="changelog-form"
        className="flex min-h-0 flex-1 flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
      >
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_14rem]">
          <form.Field
            name="version"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Версия</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder={appVersion}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />

          <form.Field
            name="status"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Статус</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(value: ChangelogStatus) => {
                      field.handleChange(value)
                      setSelectedStatus(value)
                    }}
                  >
                    <SelectTrigger
                      id={field.name}
                      className="w-full"
                      onBlur={field.handleBlur}
                      aria-invalid={isInvalid}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Черновик</SelectItem>
                      <SelectItem value="published">Опубликовано</SelectItem>
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </div>

        <form.Field
          name="title"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Заголовок</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Что изменилось в этом релизе"
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="summary"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Краткое описание</FieldLabel>
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Один-два предложения для виджета и списка"
                  aria-invalid={isInvalid}
                  className="min-h-20 resize-none"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="publishedAt"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Дата релиза</FieldLabel>
                <Input
                  id={field.name}
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  disabled={selectedStatus === 'draft'}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="content"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid} className="min-h-0 flex-1">
                <FieldLabel htmlFor={field.name}>Список изменений</FieldLabel>
                <RichTextEditor
                  value={field.state.value}
                  onChange={(html) => field.handleChange(html)}
                  className="min-h-72 w-full"
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
    </TooltipProvider>
  )
}
