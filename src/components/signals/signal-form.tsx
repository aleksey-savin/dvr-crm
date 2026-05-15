import * as React from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { StarRating } from '@/components/ui/star-rating'
import {
  addSignal,
  updateSignal,
  fetchCompanies,
  fetchDepartments,
  fetchUsers,
  fetchIndustries,
} from '@/components/signals/actions'
import type { SelectSignal } from '@/db/types'
import type { CompanyOption, DepartmentOption, UserOption } from '@/types'

type IndustryOption = { id: string; name: string }

const formSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  companyId: z.string().nullable(),
  departmentId: z.string().nullable(),
  responsibleUserId: z.string().nullable(),
  industryId: z.string().nullable(),
  signalType: z.enum(['recommendation', 'news', 'direct_contact', 'other']),
  status: z.enum(['new', 'in_progress', 'converted', 'archived']),
  rating: z.number().int().min(1).max(5).nullable(),
  description: z.string().nullable(),
})

const NULLABLE_PLACEHOLDER = '__none__'

export function SignalForm({
  item,
  onSuccess,
}: {
  item?: SelectSignal
  onSuccess?: () => void
}) {
  const [companies, setCompanies] = React.useState<CompanyOption[]>([])
  const [departments, setDepartments] = React.useState<DepartmentOption[]>([])
  const [users, setUsers] = React.useState<UserOption[]>([])
  const [industries, setIndustries] = React.useState<IndustryOption[]>([])

  React.useEffect(() => {
    fetchCompanies().then(setCompanies).catch(console.error)
    fetchDepartments().then(setDepartments).catch(console.error)
    fetchUsers().then(setUsers).catch(console.error)
    fetchIndustries().then(setIndustries).catch(console.error)
  }, [])

  const form = useForm({
    defaultValues: {
      title: item?.title ?? '',
      companyId: item?.companyId ?? null,
      departmentId: item?.departmentId ?? null,
      responsibleUserId: item?.responsibleUserId ?? null,
      industryId: item?.industryId ?? null,
      signalType: (item?.signalType as z.infer<typeof formSchema>['signalType']) ?? 'other',
      status: (item?.status as z.infer<typeof formSchema>['status']) ?? 'new',
      rating: item?.rating ?? null,
      description: item?.description ?? null,
    },
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        title: value.title,
        companyId: value.companyId || null,
        departmentId: value.departmentId || null,
        responsibleUserId: value.responsibleUserId || null,
        industryId: value.industryId || null,
        signalType: value.signalType,
        status: value.status,
        rating: value.rating ?? null,
        description: value.description || null,
      }
      try {
        if (item) {
          await updateSignal({ data: { id: item.id, ...payload } })
          toast.success('Сигнал обновлён')
        } else {
          await addSignal({ data: payload })
          toast.success('Сигнал создан')
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
      <form.Field name="title">
        {(field) => (
          <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
            <FieldLabel htmlFor={field.name}>Название *</FieldLabel>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Название сигнала"
            />
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <form.Field name="companyId">
        {(field) => (
          <Field>
            <FieldLabel>Компания</FieldLabel>
            <Combobox
              items={companies}
              itemToStringValue={(c) => c.name}
              isItemEqualToValue={(a, b) => a.id === b.id}
              value={companies.find((c) => c.id === field.state.value) ?? null}
              onValueChange={(c) => field.handleChange(c?.id ?? null)}
            >
              <ComboboxValue placeholder="Не выбрана" />
              <ComboboxContent>
                <ComboboxEmpty>Компании не найдены</ComboboxEmpty>
                <ComboboxList>
                  {(c) => <ComboboxItem key={c.id} value={c}>{c.name}</ComboboxItem>}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="signalType">
          {(field) => (
            <Field>
              <FieldLabel>Тип сигнала</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as typeof field.state.value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommendation">Рекомендация</SelectItem>
                  <SelectItem value="news">Новость</SelectItem>
                  <SelectItem value="direct_contact">Прямой контакт</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        <form.Field name="status">
          {(field) => (
            <Field>
              <FieldLabel>Статус</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as typeof field.state.value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Новый</SelectItem>
                  <SelectItem value="in_progress">В работе</SelectItem>
                  <SelectItem value="converted">Конвертирован</SelectItem>
                  <SelectItem value="archived">Архив</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="industryId">
          {(field) => (
            <Field>
              <FieldLabel>Отрасль</FieldLabel>
              <Select
                value={field.state.value ?? NULLABLE_PLACEHOLDER}
                onValueChange={(v) => field.handleChange(v === NULLABLE_PLACEHOLDER ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder="Не выбрана" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULLABLE_PLACEHOLDER}>Не выбрана</SelectItem>
                  {industries.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        <form.Field name="departmentId">
          {(field) => (
            <Field>
              <FieldLabel>Подразделение</FieldLabel>
              <Select
                value={field.state.value ?? NULLABLE_PLACEHOLDER}
                onValueChange={(v) => field.handleChange(v === NULLABLE_PLACEHOLDER ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder="Не выбрано" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULLABLE_PLACEHOLDER}>Не выбрано</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>
      </div>

      <form.Field name="responsibleUserId">
        {(field) => (
          <Field>
            <FieldLabel>Ответственный</FieldLabel>
            <Select
              value={field.state.value ?? NULLABLE_PLACEHOLDER}
              onValueChange={(v) => field.handleChange(v === NULLABLE_PLACEHOLDER ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Не выбран" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NULLABLE_PLACEHOLDER}>Не выбран</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </form.Field>

      <form.Field name="rating">
        {(field) => (
          <Field>
            <FieldLabel>Рейтинг</FieldLabel>
            <StarRating
              value={field.state.value ?? null}
              onChange={(v) => field.handleChange(v)}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <Field>
            <FieldLabel>Описание</FieldLabel>
            <Textarea
              id={field.name}
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Дополнительная информация о сигнале"
              rows={3}
            />
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
