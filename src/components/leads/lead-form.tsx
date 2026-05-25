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
import { addLead, updateLead } from '@/components/leads/actions'
import {
  fetchCompanies,
  fetchDepartments,
  fetchUsers,
  fetchIndustries,
} from '@/components/pipeline-entity/lookups'
import { fetchSources } from '@/components/sources/actions'
import type { SelectLead } from '@/db/types'
import type { CompanyOption, DepartmentOption, UserOption } from '@/types'

type IndustryOption = { id: string; name: string }
type SourceOption = { id: string; name: string }

const formSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  companyId: z.string().nullable(),
  departmentId: z.string().nullable(),
  responsibleUserId: z.string().nullable(),
  industryId: z.string().nullable(),
  sourceId: z.string().nullable(),
  budget: z.string().nullable(),
  description: z.string().nullable(),
  dueDate: z.string().nullable(),
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
  const [sources, setSources] = React.useState<SourceOption[]>([])

  React.useEffect(() => {
    fetchCompanies().then(setCompanies).catch(console.error)
    fetchDepartments({ data: { salesOnly: true } })
      .then(setDepartments)
      .catch(console.error)
    fetchUsers().then(setUsers).catch(console.error)
    fetchIndustries().then(setIndustries).catch(console.error)
    fetchSources().then(setSources).catch(console.error)
  }, [])

  const form = useForm({
    defaultValues: {
      title: item?.title ?? '',
      companyId: item?.companyId ?? null,
      departmentId: item?.departmentId ?? null,
      responsibleUserId: item?.responsibleUserId ?? null,
      industryId: item?.industryId ?? null,
      sourceId: item?.sourceId ?? null,
      budget: item?.budget ?? null,
      description: item?.description ?? null,
      dueDate: item?.dueDate ?? null,
    },
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        title: value.title,
        companyId: value.companyId || null,
        departmentId: value.departmentId || null,
        responsibleUserId: value.responsibleUserId || null,
        industryId: value.industryId || null,
        sourceId: value.sourceId || null,
        budget: value.budget || null,
        description: value.description || null,
        dueDate: value.dueDate || null,
      }
      try {
        if (item) {
          await updateLead({
            data: {
              id: item.id,
              ...payload,
              status: item.status,
              lostReasonId: item.lostReasonId,
            },
          })
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

  const selectedDepartmentId = useStore(
    form.store,
    (s) => s.values.departmentId,
  )

  const filteredUsers = React.useMemo(
    () =>
      users.filter(
        (u) => !selectedDepartmentId || u.departmentId === selectedDepartmentId,
      ),
    [users, selectedDepartmentId],
  )

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
          <Field
            data-invalid={
              field.state.meta.isTouched && !field.state.meta.isValid
            }
          >
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

      <form.Field name="companyId">
        {(field) => (
          <Field>
            <FieldLabel>Компания</FieldLabel>
            <Select
              value={field.state.value ?? NULLABLE_PLACEHOLDER}
              onValueChange={(v) =>
                field.handleChange(v === NULLABLE_PLACEHOLDER ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Не выбрана" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NULLABLE_PLACEHOLDER}>Не выбрана</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="departmentId">
          {(field) => (
            <Field>
              <FieldLabel>Подразделение</FieldLabel>
              <Select
                value={field.state.value ?? NULLABLE_PLACEHOLDER}
                onValueChange={(v) => {
                  const next = v === NULLABLE_PLACEHOLDER ? null : v
                  field.handleChange(next)
                  const responsibleId = form.getFieldValue('responsibleUserId')
                  const stillValid =
                    !responsibleId ||
                    users.some(
                      (u) =>
                        u.id === responsibleId &&
                        (!next || u.departmentId === next),
                    )
                  if (!stillValid) {
                    form.setFieldValue('responsibleUserId', null)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Не выбрано" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULLABLE_PLACEHOLDER}>
                    Не выбрано
                  </SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
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
                onValueChange={(v) =>
                  field.handleChange(v === NULLABLE_PLACEHOLDER ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Не выбран" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULLABLE_PLACEHOLDER}>
                    Не выбран
                  </SelectItem>
                  {filteredUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="industryId">
          {(field) => (
            <Field>
              <FieldLabel>Отрасль</FieldLabel>
              <Select
                value={field.state.value ?? NULLABLE_PLACEHOLDER}
                onValueChange={(v) =>
                  field.handleChange(v === NULLABLE_PLACEHOLDER ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Не выбрана" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULLABLE_PLACEHOLDER}>
                    Не выбрана
                  </SelectItem>
                  {industries.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        <form.Field name="sourceId">
          {(field) => (
            <Field>
              <FieldLabel>Источник</FieldLabel>
              <Select
                value={field.state.value ?? NULLABLE_PLACEHOLDER}
                onValueChange={(v) =>
                  field.handleChange(v === NULLABLE_PLACEHOLDER ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Не выбран" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULLABLE_PLACEHOLDER}>
                    Не выбран
                  </SelectItem>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>
      </div>

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
