import * as React from 'react'
import { useForm } from '@tanstack/react-form'
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
  addMeeting,
  updateMeeting,
  fetchCompanies,
  fetchDepartments,
  fetchUsers,
  fetchInitiatives,
} from '@/components/meetings/actions'
import type {
  CompanyOption,
  DepartmentOption,
  MeetingDetail,
  UserOption,
} from '@/types'

const NULLABLE_PLACEHOLDER = '__none__'

// externalParticipants is tracked via local React state (not a form field),
// so it must NOT be part of the schema — otherwise zod fails silently because
// the key is absent from form values.
const formSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  meetingType: z.enum(['client', 'internal']),
  scheduledAt: z.string().min(1, 'Дата и время обязательны'),
  endedAt: z.string().nullable(),
  companyId: z.string().nullable(),
  departmentId: z.string().nullable(),
  organizerId: z.string().nullable(),
  summary: z.string().nullable(),
  accountId: z.string().nullable(),
  leadId: z.string().nullable(),
  tenderId: z.string().nullable(),
  initiativeId: z.string().nullable(),
  participantIds: z.array(z.string()),
})

type ExternalParticipant = { name: string; contactId: string | null }

type InitiativeOption = { id: string; title: string }

type Props = {
  item?: MeetingDetail
  /** When set, the form is in "quick-add from initiative" mode: hides
   * initiative + company pickers (initiative is fixed) and the title prefix
   * defaults from initiative context. */
  presetInitiativeId?: string | null
  presetCompanyId?: string | null
  presetDepartmentId?: string | null
  onSuccess?: () => void
}

export function MeetingForm({
  item,
  presetInitiativeId = null,
  presetCompanyId = null,
  presetDepartmentId = null,
  onSuccess,
}: Props) {
  const [companies, setCompanies] = React.useState<CompanyOption[]>([])
  const [departments, setDepartments] = React.useState<DepartmentOption[]>([])
  const [users, setUsers] = React.useState<UserOption[]>([])
  const [initiatives, setInitiatives] = React.useState<InitiativeOption[]>([])
  const [externalParticipants, setExternalParticipants] = React.useState<
    ExternalParticipant[]
  >(item?.externalParticipants.map((ep) => ({ name: ep.name, contactId: ep.contactId })) ?? [])

  React.useEffect(() => {
    fetchCompanies().then(setCompanies).catch(console.error)
    fetchDepartments().then(setDepartments).catch(console.error)
    fetchUsers().then(setUsers).catch(console.error)
    fetchInitiatives().then(setInitiatives).catch(console.error)
  }, [])

  const toDatetimeLocal = (d: Date | null | undefined) => {
    if (!d) return ''
    const dt = new Date(d)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
  }

  // When creating, summary is hidden (it's filled at completion time).
  const isCreate = !item
  const isCompleted = item?.status === 'completed'
  // In quick mode (called from an initiative sheet), initiative + company are
  // pre-set and hidden — keeps the form minimal.
  const isQuickMode = isCreate && presetInitiativeId !== null

  const form = useForm({
    defaultValues: {
      title: item?.title ?? '',
      meetingType: (item?.meetingType ?? 'client') as 'client' | 'internal',
      scheduledAt: toDatetimeLocal(item?.scheduledAt),
      endedAt: item?.endedAt ? toDatetimeLocal(item.endedAt) : null,
      companyId: item?.companyId ?? presetCompanyId ?? null,
      departmentId: item?.departmentId ?? presetDepartmentId ?? null,
      organizerId: item?.organizerId ?? null,
      summary: item?.summary ?? null,
      accountId: item?.accountId ?? null,
      leadId: item?.leadId ?? null,
      tenderId: item?.tenderId ?? null,
      initiativeId: item?.initiativeId ?? presetInitiativeId ?? null,
      participantIds:
        item?.participants.map((p) => p.userId) ?? ([] as string[]),
    },
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        title: value.title,
        meetingType: value.meetingType,
        scheduledAt: value.scheduledAt,
        endedAt: value.endedAt || null,
        companyId: value.companyId || null,
        departmentId: value.departmentId || null,
        organizerId: value.organizerId || null,
        summary: value.summary || null,
        accountId: value.accountId || null,
        leadId: value.leadId || null,
        tenderId: value.tenderId || null,
        initiativeId: value.initiativeId || null,
        participantIds: value.participantIds,
        externalParticipants:
          value.meetingType === 'internal'
            ? []
            : externalParticipants.filter((ep) => ep.name.trim()),
      }
      try {
        if (item) {
          await updateMeeting({ data: { id: item.id, ...payload } })
          toast.success('Встреча обновлена')
        } else {
          await addMeeting({ data: payload })
          toast.success('Встреча создана')
        }
        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
      }
    },
  })

  const addExternalParticipant = () => {
    setExternalParticipants((prev) => [...prev, { name: '', contactId: null }])
  }

  const removeExternalParticipant = (index: number) => {
    setExternalParticipants((prev) => prev.filter((_, i) => i !== index))
  }

  const updateExternalParticipantName = (index: number, name: string) => {
    setExternalParticipants((prev) =>
      prev.map((ep, i) => (i === index ? { ...ep, name } : ep)),
    )
  }

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
              placeholder="Название встречи"
            />
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="meetingType">
          {(field) => (
            <Field>
              <FieldLabel>Тип встречи</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) =>
                  field.handleChange(v as 'client' | 'internal')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Клиентская</SelectItem>
                  <SelectItem value="internal">Внутренняя</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        <form.Field name="scheduledAt">
          {(field) => (
            <Field
              data-invalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
            >
              <FieldLabel htmlFor={field.name}>Дата и время *</FieldLabel>
              <Input
                id={field.name}
                type="datetime-local"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={!isCreate}
              />
              <FieldError errors={field.state.meta.errors} />
              {!isCreate && (
                <p className="text-xs text-muted-foreground">
                  Чтобы перенести встречу — используйте «Перенести».
                </p>
              )}
            </Field>
          )}
        </form.Field>
      </div>

      {!isQuickMode && (
        <form.Field name="initiativeId">
          {(field) => (
            <Field>
              <FieldLabel>Инициатива</FieldLabel>
              <Combobox
                items={initiatives}
                itemToStringValue={(i) => i.title}
                isItemEqualToValue={(a, b) => a.id === b.id}
                value={
                  initiatives.find((i) => i.id === field.state.value) ?? null
                }
                onValueChange={(i) => field.handleChange(i?.id ?? null)}
              >
                <ComboboxValue placeholder="Не выбрана" />
                <ComboboxContent>
                  <ComboboxEmpty>Инициативы не найдены</ComboboxEmpty>
                  <ComboboxList>
                    {(i) => (
                      <ComboboxItem key={i.id} value={i}>
                        {i.title}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </Field>
          )}
        </form.Field>
      )}

      {!isQuickMode && (
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
                    {(c) => (
                      <ComboboxItem key={c.id} value={c}>
                        {c.name}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </Field>
          )}
        </form.Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="departmentId">
          {(field) => (
            <Field>
              <FieldLabel>Подразделение</FieldLabel>
              <Select
                value={field.state.value ?? NULLABLE_PLACEHOLDER}
                onValueChange={(v) =>
                  field.handleChange(v === NULLABLE_PLACEHOLDER ? null : v)
                }
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

        <form.Field name="organizerId">
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
                  {users.map((u) => (
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

      <form.Field name="participantIds">
        {(field) => (
          <Field>
            <FieldLabel>Наши участники</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {users.map((u) => {
                const selected = field.state.value.includes(u.id)
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      field.handleChange(
                        selected
                          ? field.state.value.filter((id) => id !== u.id)
                          : [...field.state.value, u.id],
                      )
                    }}
                    className={`rounded-md border px-2.5 py-1 text-sm transition-colors ${
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input hover:bg-accent'
                    }`}
                  >
                    {u.name}
                  </button>
                )
              })}
            </div>
          </Field>
        )}
      </form.Field>

      <form.Subscribe selector={(s) => s.values.meetingType}>
        {(meetingType) =>
          meetingType === 'client' ? (
            <Field>
              <FieldLabel>Внешние участники (клиентская сторона)</FieldLabel>
              <div className="flex flex-col gap-2">
                {externalParticipants.map((ep, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={ep.name}
                      onChange={(e) =>
                        updateExternalParticipantName(index, e.target.value)
                      }
                      placeholder="Имя участника"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeExternalParticipant(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={addExternalParticipant}
                >
                  + Добавить участника
                </Button>
              </div>
            </Field>
          ) : null
        }
      </form.Subscribe>

      {/* Summary is filled at completion (see completeMeeting). Only show on
         edit of an already-completed meeting so it can be corrected. */}
      {isCompleted && (
        <form.Field name="summary">
          {(field) => (
            <Field>
              <FieldLabel>Саммари</FieldLabel>
              <Textarea
                id={field.name}
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Итоги встречи"
                rows={3}
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
