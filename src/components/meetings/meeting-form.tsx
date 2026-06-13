import * as React from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import * as z from 'zod'
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleAlertIcon,
  Loader2Icon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import {
  addMeeting,
  updateMeeting,
  fetchCompanies,
  fetchDepartments,
  fetchUsers,
  fetchInitiatives,
  checkRoomAvailability,
} from '@/components/meetings/actions'
import { fetchMeetingRooms } from '@/components/meeting-rooms/actions'
import { WizardStepper } from '@/components/meetings/wizard-stepper'
import type { WizardStep } from '@/components/meetings/wizard-stepper'
import type {
  CompanyOption,
  DepartmentOption,
  InitiativeOption,
  MeetingDetail,
  MeetingLocationType,
  MeetingRoomOption,
  RoomConflict,
  UserOption,
} from '@/types'

const NULLABLE_PLACEHOLDER = '__none__'

// externalParticipants is tracked via local React state (not a form field),
// so it must NOT be part of the schema — otherwise zod fails silently because
// the key is absent from form values.
const formSchema = z
  .object({
    title: z.string().min(1, 'Название обязательно'),
    meetingType: z.enum(['client', 'internal']),
    locationType: z.enum(['client_site', 'office']),
    meetingRoomId: z.string().nullable(),
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
  .superRefine((val, ctx) => {
    // Booking a room requires a concrete slot: planned end after the start.
    if (val.locationType !== 'office' || !val.meetingRoomId) return
    if (!val.endedAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['endedAt'],
        message: 'Для брони переговорки укажите окончание',
      })
    } else if (val.scheduledAt && val.endedAt <= val.scheduledAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['endedAt'],
        message: 'Окончание должно быть позже начала',
      })
    }
  })

/** Сдвигает значение input[type=datetime-local] на заданное число минут. */
function addMinutes(datetimeLocal: string, minutes: number): string {
  const d = new Date(datetimeLocal)
  if (Number.isNaN(d.getTime())) return datetimeLocal
  d.setMinutes(d.getMinutes() + minutes)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const availabilityTimeFmt = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

type AvailabilityState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'free' }
  | { kind: 'busy'; conflicts: RoomConflict[] }

/** Живая проверка занятости переговорки на выбранный слот. */
function RoomAvailabilityHint({
  roomId,
  scheduledAt,
  endedAt,
  excludeMeetingId,
}: {
  roomId: string | null
  scheduledAt: string
  endedAt: string | null
  excludeMeetingId: string | null
}) {
  const [state, setState] = React.useState<AvailabilityState>({ kind: 'idle' })

  React.useEffect(() => {
    if (!roomId || !scheduledAt) {
      setState({ kind: 'idle' })
      return
    }
    let cancelled = false
    setState({ kind: 'checking' })
    const timer = setTimeout(() => {
      checkRoomAvailability({
        data: { roomId, scheduledAt, endedAt, excludeMeetingId },
      })
        .then((res) => {
          if (cancelled) return
          setState(
            res.available
              ? { kind: 'free' }
              : { kind: 'busy', conflicts: res.conflicts },
          )
        })
        .catch(() => {
          if (!cancelled) setState({ kind: 'idle' })
        })
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [roomId, scheduledAt, endedAt, excludeMeetingId])

  if (state.kind === 'idle') return null

  if (state.kind === 'checking') {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2Icon className="size-3.5 animate-spin" />
        Проверяем доступность…
      </p>
    )
  }

  if (state.kind === 'free') {
    return (
      <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <CheckCircle2Icon className="size-3.5" />
        Свободна в выбранное время
      </p>
    )
  }

  return (
    <div className="space-y-0.5 text-xs text-destructive">
      {state.conflicts.slice(0, 2).map((c) => (
        <p key={c.id} className="flex items-center gap-1.5">
          <CircleAlertIcon className="size-3.5 shrink-0" />
          <span className="truncate">
            Занята: «{c.title}»,{' '}
            {availabilityTimeFmt.format(new Date(c.scheduledAt))} —{' '}
            {availabilityTimeFmt.format(new Date(c.endedAt))}
          </span>
        </p>
      ))}
    </div>
  )
}

/** Кнопки-чипы выбора участников (используется для своего и чужих подразделений). */
function ParticipantChips({
  users,
  selected,
  onToggle,
}: {
  users: UserOption[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {users.map((u) => {
        const isSelected = selected.includes(u.id)
        return (
          <button
            key={u.id}
            type="button"
            onClick={() => onToggle(u.id)}
            className={`rounded-md border px-2.5 py-1 text-sm transition-colors ${
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input hover:bg-accent'
            }`}
          >
            {u.name}
          </button>
        )
      })}
    </div>
  )
}

type ExternalParticipant = { name: string; contactId: string | null }

const LAST_STEP = 3

const STEPS: WizardStep[] = [
  { id: 1, label: 'Основное' },
  { id: 2, label: 'Время' },
  { id: 3, label: 'Участники' },
]

// Поля, проверяемые перед уходом с шага. Шаг 3 валидируется финальным сабмитом.
const STEP_FIELDS: Record<
  number,
  Array<'title' | 'scheduledAt' | 'endedAt'>
> = {
  1: ['title'],
  2: ['scheduledAt', 'endedAt'],
  3: [],
}

type Props = {
  item?: MeetingDetail
  /** Копирование: поля предзаполняются из этой встречи, кроме дат (пустые),
   * сабмит создаёт новую запись, форма открывается сразу на шаге «Время». */
  copyFrom?: MeetingDetail
  /** When set, the form is in "quick-add from initiative" mode: hides
   * initiative + company pickers (initiative is fixed) and the title prefix
   * defaults from initiative context. */
  presetInitiativeId?: string | null
  presetCompanyId?: string | null
  presetDepartmentId?: string | null
  /** Предзаполнение из календаря бронирования: слот и переговорка. */
  presetScheduledAt?: string | null
  presetMeetingRoomId?: string | null
  onSuccess?: () => void
}

export function MeetingForm({
  item,
  copyFrom,
  presetInitiativeId = null,
  presetCompanyId = null,
  presetDepartmentId = null,
  presetScheduledAt = null,
  presetMeetingRoomId = null,
  onSuccess,
}: Props) {
  // Источник предзаполнения полей: редактируемая встреча или копируемая.
  const source = item ?? copyFrom
  const [companies, setCompanies] = React.useState<CompanyOption[]>([])
  const [departments, setDepartments] = React.useState<DepartmentOption[]>([])
  const [users, setUsers] = React.useState<UserOption[]>([])
  const [initiatives, setInitiatives] = React.useState<InitiativeOption[]>([])
  const [rooms, setRooms] = React.useState<MeetingRoomOption[]>([])
  const [externalParticipants, setExternalParticipants] = React.useState<
    ExternalParticipant[]
  >(
    source?.externalParticipants.map((ep) => ({
      name: ep.name,
      contactId: ep.contactId,
    })) ?? [],
  )

  // При редактировании все шаги доступны сразу; при создании — по мере
  // прохождения; копия стартует с шага «Время» (шаг 1 уже заполнен).
  const [step, setStep] = React.useState(copyFrom ? 2 : 1)
  const [maxVisited, setMaxVisited] = React.useState(
    item ? LAST_STEP : copyFrom ? 2 : 1,
  )
  const [othersOpen, setOthersOpen] = React.useState(false)

  // Попапы комбобоксов должны рендериться внутри диалога, иначе модальный
  // Dialog блокирует клики по выпадающему списку (паттерн как в todo-form).
  const portalRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    fetchCompanies().then(setCompanies).catch(console.error)
    fetchDepartments().then(setDepartments).catch(console.error)
    fetchUsers().then(setUsers).catch(console.error)
    fetchInitiatives().then(setInitiatives).catch(console.error)
    fetchMeetingRooms().then(setRooms).catch(console.error)
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
  // Подсказка о занятости уместна, только пока встреча реально держит слот.
  const showAvailability = isCreate || item.status === 'scheduled'
  // In quick mode (called from an initiative sheet), initiative + company are
  // pre-set and hidden — keeps the form minimal.
  const isQuickMode = isCreate && presetInitiativeId !== null

  const form = useForm({
    defaultValues: {
      title: source?.title ?? '',
      meetingType: (source?.meetingType ?? 'client') as 'client' | 'internal',
      locationType: source?.locationType ?? 'office',
      meetingRoomId: source?.meetingRoomId ?? presetMeetingRoomId ?? null,
      // Копия наследует переговорку, но даты остаются пустыми.
      scheduledAt: item
        ? toDatetimeLocal(item.scheduledAt)
        : (presetScheduledAt ?? ''),
      endedAt: item?.endedAt
        ? toDatetimeLocal(item.endedAt)
        : presetScheduledAt
          ? addMinutes(presetScheduledAt, 60)
          : null,
      companyId: source?.companyId ?? presetCompanyId ?? null,
      departmentId: source?.departmentId ?? presetDepartmentId ?? null,
      organizerId: source?.organizerId ?? null,
      summary: item?.summary ?? null,
      accountId: source?.accountId ?? null,
      leadId: source?.leadId ?? null,
      tenderId: source?.tenderId ?? null,
      initiativeId: source?.initiativeId ?? presetInitiativeId ?? null,
      participantIds:
        source?.participants.map((p) => p.userId) ?? ([] as string[]),
    },
    validators: { onSubmit: formSchema },
    // Финальный сабмит мог провалиться на поле скрытого шага (после правок и
    // прыжков по степперу) — переходим к первому невалидному.
    onSubmitInvalid: ({ formApi }) => {
      const FIELD_STEP: Record<string, number> = {
        title: 1,
        scheduledAt: 2,
        endedAt: 2,
      }
      const invalidSteps = Object.entries(formApi.state.fieldMeta)
        .filter(([, meta]) => meta !== undefined && !meta.isValid)
        .map(([name]) => FIELD_STEP[name] ?? LAST_STEP)
      if (invalidSteps.length > 0) setStep(Math.min(...invalidSteps))
    },
    onSubmit: async ({ value }) => {
      const payload = {
        title: value.title,
        meetingType: value.meetingType,
        locationType: value.locationType,
        meetingRoomId:
          value.locationType === 'office' ? value.meetingRoomId || null : null,
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

  // Каскад автоподстановок при выборе инициативы: компания, подразделение и
  // ответственный подтягиваются из неё (только по явному действию пользователя).
  const applyInitiative = (init: InitiativeOption) => {
    form.setFieldValue('initiativeId', init.id)
    if (init.companyId) form.setFieldValue('companyId', init.companyId)
    if (init.departmentId) form.setFieldValue('departmentId', init.departmentId)
    if (init.responsibleUserId) {
      form.setFieldValue('organizerId', init.responsibleUserId)
    }
  }

  // Quick-mode: инициатива зафиксирована пресетом — после загрузки справочника
  // добиваем из неё только пустые поля (идемпотентно; в edit не выполняется).
  React.useEffect(() => {
    if (!isQuickMode) return
    const init = initiatives.find((i) => i.id === presetInitiativeId)
    if (!init) return
    const values = form.state.values
    if (!values.companyId && init.companyId) {
      form.setFieldValue('companyId', init.companyId)
    }
    if (!values.departmentId && init.departmentId) {
      form.setFieldValue('departmentId', init.departmentId)
    }
    if (!values.organizerId && init.responsibleUserId) {
      form.setFieldValue('organizerId', init.responsibleUserId)
    }
  }, [initiatives, isQuickMode, presetInitiativeId, form])

  const validateStep = async (s: number): Promise<boolean> => {
    const results = await Promise.all(
      STEP_FIELDS[s].map((name) => form.validateField(name, 'submit')),
    )
    return results.every((errors) => errors.length === 0)
  }

  const goNext = async () => {
    if (!(await validateStep(step))) return
    const next = Math.min(step + 1, LAST_STEP)
    setStep(next)
    setMaxVisited((m) => Math.max(m, next))
  }

  const goToStep = async (target: number) => {
    if (target === step) return
    // Назад — всегда свободно.
    if (target < step) {
      setStep(target)
      return
    }
    if (target > maxVisited) return
    // Прыжок вперёд — промежуточные шаги должны быть валидны.
    for (let s = step; s < target; s++) {
      if (!(await validateStep(s))) {
        setStep(s)
        return
      }
    }
    setStep(target)
  }

  // Кнопки ±30 минут у окончания. База — текущее окончание, а если оно ещё
  // пусто — начало + час (то же, что даёт автоподстановка).
  const shiftEnd = (deltaMinutes: number) => {
    const { scheduledAt, endedAt } = form.state.values
    const base = endedAt || (scheduledAt ? addMinutes(scheduledAt, 60) : '')
    if (!base) return
    const next = addMinutes(base, deltaMinutes)
    if (scheduledAt && next <= scheduledAt) return
    form.setFieldValue('endedAt', next)
  }

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
        // Enter на промежуточном шаге ведёт «Далее», а не отправку всей формы.
        if (step < LAST_STEP) void goNext()
        else void form.handleSubmit()
      }}
    >
      <div ref={portalRef} />
      <WizardStepper
        steps={STEPS}
        current={step}
        maxVisited={maxVisited}
        onStepClick={(s) => void goToStep(s)}
      />

      {/* ── Шаг 1: Основное ─────────────────────────────────────────────── */}
      {step === 1 && (
        <>
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
                <FieldError
                  errors={
                    field.state.meta.isTouched
                      ? field.state.meta.errors
                      : undefined
                  }
                />
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

            <form.Field name="locationType">
              {(field) => (
                <Field>
                  <FieldLabel>Место проведения</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => {
                      const next = v as MeetingLocationType
                      field.handleChange(next)
                      // Вне офиса переговорка не нужна.
                      if (next === 'client_site') {
                        form.setFieldValue('meetingRoomId', null)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">В офисе</SelectItem>
                      <SelectItem value="client_site">У клиента</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>
          </div>

          {!isQuickMode && (
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="companyId">
                {(field) => (
                  <Field>
                    <FieldLabel>Компания</FieldLabel>
                    <Combobox
                      items={companies}
                      itemToStringLabel={(c) => c.name}
                      itemToStringValue={(c) => c.name}
                      isItemEqualToValue={(a, b) => a.id === b.id}
                      value={
                        companies.find((c) => c.id === field.state.value) ??
                        null
                      }
                      onValueChange={(c) => {
                        const companyId = c?.id ?? null
                        field.handleChange(companyId)
                        if (!companyId) return
                        const filtered = initiatives.filter(
                          (i) => i.companyId === companyId,
                        )
                        const currentId = form.state.values.initiativeId
                        // Инициатива другой компании больше не подходит.
                        if (
                          currentId &&
                          !filtered.some((i) => i.id === currentId)
                        ) {
                          form.setFieldValue('initiativeId', null)
                        }
                        // Единственная инициатива компании выбирается сама.
                        if (filtered.length === 1) applyInitiative(filtered[0])
                      }}
                    >
                      <ComboboxInput
                        placeholder="Не выбрана"
                        showClear
                        className="w-full"
                      />
                      <ComboboxContent
                        container={portalRef.current}
                        className="min-w-(--anchor-width)"
                      >
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

              <form.Subscribe selector={(s) => s.values.companyId}>
                {(companyId) => {
                  const filtered = companyId
                    ? initiatives.filter((i) => i.companyId === companyId)
                    : initiatives
                  return (
                    <form.Field name="initiativeId">
                      {(field) => {
                        // Выбранная инициатива может не пройти фильтр (данные
                        // разъехались при редактировании) — не теряем её из списка.
                        const current = initiatives.find(
                          (i) => i.id === field.state.value,
                        )
                        const items =
                          current && !filtered.some((i) => i.id === current.id)
                            ? [current, ...filtered]
                            : filtered
                        return (
                          <Field>
                            <FieldLabel>Инициатива</FieldLabel>
                            <Combobox
                              items={items}
                              itemToStringLabel={(i) => i.title}
                              itemToStringValue={(i) => i.title}
                              isItemEqualToValue={(a, b) => a.id === b.id}
                              value={current ?? null}
                              onValueChange={(i) => {
                                if (i) applyInitiative(i)
                                else field.handleChange(null)
                              }}
                            >
                              <ComboboxInput
                                placeholder="Не выбрана"
                                showClear
                                className="w-full"
                              />
                              <ComboboxContent
                                container={portalRef.current}
                                className="min-w-(--anchor-width)"
                              >
                                <ComboboxEmpty>
                                  Инициативы не найдены
                                </ComboboxEmpty>
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
                        )
                      }}
                    </form.Field>
                  )
                }}
              </form.Subscribe>
            </div>
          )}
        </>
      )}

      {/* ── Шаг 2: Время и переговорка ──────────────────────────────────── */}
      {step === 2 && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="scheduledAt">
              {(field) => (
                <Field
                  data-invalid={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                >
                  <FieldLabel htmlFor={field.name}>Начало *</FieldLabel>
                  <Input
                    id={field.name}
                    type="datetime-local"
                    value={field.state.value}
                    onChange={(e) => {
                      const v = e.target.value
                      field.handleChange(v)
                      // Начало задаёт окончание: +1 час; дальше его можно
                      // поправить вручную или кнопками ±30 мин.
                      if (v) form.setFieldValue('endedAt', addMinutes(v, 60))
                    }}
                    onBlur={field.handleBlur}
                    disabled={!isCreate}
                  />
                  <FieldError
                    errors={
                      field.state.meta.isTouched
                        ? field.state.meta.errors
                        : undefined
                    }
                  />
                  {!isCreate && (
                    <p className="text-xs text-muted-foreground">
                      Чтобы перенести встречу — используйте «Перенести».
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field name="endedAt">
              {(field) => (
                <Field
                  data-invalid={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                >
                  <FieldLabel htmlFor={field.name}>Окончание</FieldLabel>
                  <div className="flex items-center gap-1.5">
                    <Input
                      id={field.name}
                      type="datetime-local"
                      className="flex-1"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value || null)
                      }
                      onBlur={field.handleBlur}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 px-2 tabular-nums"
                      title="Убавить 30 минут"
                      onClick={() => shiftEnd(-30)}
                    >
                      −30
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 px-2 tabular-nums"
                      title="Добавить 30 минут"
                      onClick={() => shiftEnd(30)}
                    >
                      +30
                    </Button>
                  </div>
                  <FieldError
                    errors={
                      field.state.meta.isTouched
                        ? field.state.meta.errors
                        : undefined
                    }
                  />
                </Field>
              )}
            </form.Field>
          </div>

          <form.Subscribe selector={(s) => s.values.locationType}>
            {(locationType) =>
              locationType === 'office' ? (
                <form.Field name="meetingRoomId">
                  {(field) => (
                    <Field>
                      <FieldLabel>Переговорка</FieldLabel>
                      <Select
                        value={field.state.value ?? NULLABLE_PLACEHOLDER}
                        onValueChange={(v) => {
                          const next = v === NULLABLE_PLACEHOLDER ? null : v
                          field.handleChange(next)
                          // Бронь требует конкретного слота — подставляем час по
                          // умолчанию, если окончание ещё не выбрано.
                          if (next) {
                            const { scheduledAt, endedAt } = form.state.values
                            if (scheduledAt && !endedAt) {
                              form.setFieldValue(
                                'endedAt',
                                addMinutes(scheduledAt, 60),
                              )
                            }
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Без брони переговорки" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NULLABLE_PLACEHOLDER}>
                            Без брони переговорки
                          </SelectItem>
                          {rooms.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {rooms.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Переговорок пока нет — создайте их в справочнике
                          «Переговорки».
                        </p>
                      )}
                      {showAvailability && (
                        <form.Subscribe
                          selector={(s) =>
                            [s.values.scheduledAt, s.values.endedAt] as const
                          }
                        >
                          {([scheduledAt, endedAt]) => (
                            <RoomAvailabilityHint
                              roomId={field.state.value}
                              scheduledAt={scheduledAt}
                              endedAt={endedAt}
                              excludeMeetingId={item?.id ?? null}
                            />
                          )}
                        </form.Subscribe>
                      )}
                    </Field>
                  )}
                </form.Field>
              ) : null
            }
          </form.Subscribe>
        </>
      )}

      {/* ── Шаг 3: Участники ────────────────────────────────────────────── */}
      {step === 3 && (
        <form.Subscribe selector={(s) => s.values.departmentId}>
          {(departmentId) => {
            const deptUsers = departmentId
              ? users.filter((u) => u.departmentId === departmentId)
              : users
            const otherUsers = departmentId
              ? users.filter((u) => u.departmentId !== departmentId)
              : []
            return (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <form.Field name="departmentId">
                    {(field) => (
                      <Field>
                        <FieldLabel>Подразделение</FieldLabel>
                        <Select
                          value={field.state.value ?? NULLABLE_PLACEHOLDER}
                          onValueChange={(v) =>
                            field.handleChange(
                              v === NULLABLE_PLACEHOLDER ? null : v,
                            )
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
                    {(field) => {
                      // Текущий выбранный остаётся в списке, даже если он из
                      // другого подразделения — Select не должен терять значение.
                      const current = users.find(
                        (u) => u.id === field.state.value,
                      )
                      const options =
                        current && !deptUsers.some((u) => u.id === current.id)
                          ? [...deptUsers, current]
                          : deptUsers
                      return (
                        <Field>
                          <FieldLabel>Ответственный</FieldLabel>
                          <Select
                            value={field.state.value ?? NULLABLE_PLACEHOLDER}
                            onValueChange={(v) =>
                              field.handleChange(
                                v === NULLABLE_PLACEHOLDER ? null : v,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Не выбран" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NULLABLE_PLACEHOLDER}>
                                Не выбран
                              </SelectItem>
                              {options.map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      )
                    }}
                  </form.Field>
                </div>

                <form.Field name="participantIds">
                  {(field) => {
                    const toggle = (id: string) => {
                      field.handleChange(
                        field.state.value.includes(id)
                          ? field.state.value.filter((x) => x !== id)
                          : [...field.state.value, id],
                      )
                    }
                    const selectedOtherCount = otherUsers.filter((u) =>
                      field.state.value.includes(u.id),
                    ).length
                    return (
                      <Field>
                        <FieldLabel>Наши участники</FieldLabel>
                        {deptUsers.length > 0 ? (
                          <ParticipantChips
                            users={deptUsers}
                            selected={field.state.value}
                            onToggle={toggle}
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            В выбранном подразделении нет пользователей.
                          </p>
                        )}
                        {departmentId && otherUsers.length > 0 && (
                          <Collapsible
                            open={othersOpen || selectedOtherCount > 0}
                            onOpenChange={setOthersOpen}
                          >
                            <CollapsibleTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-fit px-1.5 text-muted-foreground"
                              >
                                <ChevronDownIcon className="size-4" />
                                Другие участники
                                {selectedOtherCount > 0 &&
                                  ` (${selectedOtherCount})`}
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-2">
                              <ParticipantChips
                                users={otherUsers}
                                selected={field.state.value}
                                onToggle={toggle}
                              />
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </Field>
                    )
                  }}
                </form.Field>

                <form.Subscribe selector={(s) => s.values.meetingType}>
                  {(meetingType) =>
                    meetingType === 'client' ? (
                      <Field>
                        <FieldLabel>
                          Внешние участники (клиентская сторона)
                        </FieldLabel>
                        <div className="flex flex-col gap-2">
                          {externalParticipants.map((ep, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <Input
                                value={ep.name}
                                onChange={(e) =>
                                  updateExternalParticipantName(
                                    index,
                                    e.target.value,
                                  )
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

                {/* Summary is filled at completion (see completeMeeting). Only
                   show on edit of an already-completed meeting so it can be
                   corrected. */}
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
              </>
            )
          }}
        </form.Subscribe>
      )}

      {/* ── Футер: навигация по шагам / отправка ────────────────────────── */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(step - 1)}
          className={step === 1 ? 'invisible' : undefined}
        >
          Назад
        </Button>
        {step < LAST_STEP ? (
          <Button type="button" onClick={() => void goNext()}>
            Далее
          </Button>
        ) : (
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Сохранение...'
                  : item
                    ? 'Сохранить'
                    : 'Создать'}
              </Button>
            )}
          </form.Subscribe>
        )}
      </div>
    </form>
  )
}
