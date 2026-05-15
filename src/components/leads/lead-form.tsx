import * as React from 'react'
import { useForm, useStore } from '@tanstack/react-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  addLead,
  updateLead,
  fetchCompanies,
  fetchDepartments,
  fetchUsers,
  fetchIndustries,
} from '@/components/leads/actions'
import type { SelectLead } from '@/db/types'
import type { CompanyOption, DepartmentOption, UserOption } from '@/types'

type IndustryOption = { id: string; name: string }

const formSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  companyId: z.string().nullable(),
  departmentId: z.string().nullable(),
  responsibleUserId: z.string().nullable(),
  industryId: z.string().nullable(),
  source: z.string().nullable(),
  status: z.enum(['new', 'in_progress', 'converted', 'rejected']),
  budget: z.string().nullable(),
  description: z.string().nullable(),
  dueDate: z.string().nullable(),
  lostReason: z.string().nullable(),
})

const NULLABLE_PLACEHOLDER = '__none__'

export function LeadForm({
  item,
  onSuccess,
}: {
  item?: SelectLead
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
      source: item?.source ?? null,
      status: (item?.status as z.infer<typeof formSchema>['status']) ?? 'new',
      budget: item?.budget ?? null,
      description: item?.description ?? null,
      dueDate: item?.dueDate ?? null,
      lostReason: item?.lostReason ?? null,
    },
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        title: value.title,
        companyId: value.companyId || null,
        departmentId: value.departmentId || null,
        responsibleUserId: value.responsibleUserId || null,
        industryId: value.industryId || null,
        source: value.source || null,
        status: value.status,
        budget: value.budget || null,
        description: value.description || null,
        dueDate: value.dueDate || null,
        lostReason: value.status === 'rejected' ? (value.lostReason || null) : null,
      }
      try {
        if (item) {
          await updateLead({ data: { id: item.id, ...payload } })
          toast.success('Лид обновлён')
        } else {
          await addLead({ data: payload })
          toast.success('Лид создан')
        }
        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
      }
    },
  })

  const currentStatus = useStore(form.store, (s) => s.values.status)

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
              placeholder="Название лида"
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
                  <SelectItem value="rejected">Отклонён</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="source">
          {(field) => (
            <Field>
              <FieldLabel>Источник</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Сайт, звонок, реклама..."
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="budget">
          {(field) => (
            <Field>
              <FieldLabel>Бюджет, ₽</FieldLabel>
              <Input
                id={field.name}
                type="number"
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="0"
              />
            </Field>
          )}
        </form.Field>
      </div>

      <form.Field name="dueDate">
        {(field) => (
          <Field>
            <FieldLabel>Срок</FieldLabel>
            <Input
              id={field.name}
              type="date"
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
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
              placeholder="Дополнительная информация о лиде"
              rows={3}
            />
          </Field>
        )}
      </form.Field>

      {currentStatus === 'rejected' && (
        <form.Field name="lostReason">
          {(field) => (
            <Field>
              <FieldLabel>Причина отказа</FieldLabel>
              <Textarea
                id={field.name}
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Почему лид отклонён?"
                rows={2}
              />
            </Field>
          )}
        </form.Field>
      )}

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
