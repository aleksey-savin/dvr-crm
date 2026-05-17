import { useForm, useStore } from '@tanstack/react-form'
import { toast } from 'sonner'
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
import { addInitiative, updateInitiative } from './actions'
import type { InitiativeSource, PipelineStageOption } from '@/types'
import type { SelectInitiative } from '@/db/types'

const NULLABLE = '__none__'

type PipelineOption = { id: string; name: string; stages: PipelineStageOption[] }

export type InitiativeFormPayload = {
  title: string
  pipelineId?: string | null
  stageId?: string | null
  companyId?: string | null
  companyAccountId?: string | null
  departmentId?: string | null
  responsibleUserId?: string | null
  budget?: string | null
  dueDate?: string | null
  description?: string | null
  sourceType: InitiativeSource
  sourceLeadId?: string | null
  sourceSignalId?: string | null
}

type InitiativeFormProps = {
  item?: SelectInitiative & {
    pipeline: { id: string; name: string } | null
    stage: PipelineStageOption | null
    company: { id: string; name: string } | null
    department: { id: string; name: string } | null
    responsible: { id: string; name: string } | null
  }
  prefill?: {
    title?: string
    pipelineId?: string | null
    stageId?: string | null
    companyId?: string | null
    departmentId?: string | null
    responsibleUserId?: string | null
    budget?: string | null
    dueDate?: string | null
    description?: string | null
    sourceType?: InitiativeSource
    sourceLeadId?: string | null
    sourceSignalId?: string | null
    companyAccountId?: string | null
  }
  options: {
    pipelines: PipelineOption[]
    departments: Array<{ id: string; name: string }>
    users: Array<{ id: string; name: string }>
    companies: Array<{ id: string; name: string }>
    refusalReasons: Array<{ id: string; name: string }>
  }
  customSubmitFn?: (payload: InitiativeFormPayload) => Promise<{ id: string }>
  onSuccess?: (initiativeId?: string) => void
  // Hide pipeline/stage selects when both are pre-determined (e.g. when
  // creating from a specific kanban column).
  hidePipelineStage?: boolean
}

export function InitiativeForm({
  item,
  prefill,
  options,
  customSubmitFn,
  onSuccess,
  hidePipelineStage = false,
}: InitiativeFormProps) {
  const form = useForm({
    defaultValues: {
      title: item?.title ?? prefill?.title ?? '',
      pipelineId: item?.pipelineId ?? prefill?.pipelineId ?? null,
      stageId: item?.stageId ?? prefill?.stageId ?? null,
      companyId: item?.companyId ?? prefill?.companyId ?? null,
      companyAccountId:
        item?.companyAccountId ?? prefill?.companyAccountId ?? null,
      departmentId: item?.departmentId ?? prefill?.departmentId ?? null,
      responsibleUserId:
        item?.responsibleUserId ?? prefill?.responsibleUserId ?? null,
      budget: item?.budget ?? prefill?.budget ?? '',
      description: item?.description ?? prefill?.description ?? '',
      dueDate: item?.dueDate ?? prefill?.dueDate ?? '',
      sourceType: (item?.sourceType ??
        prefill?.sourceType ??
        'manual') as InitiativeSource,
      sourceLeadId: item?.sourceLeadId ?? prefill?.sourceLeadId ?? null,
      sourceSignalId: item?.sourceSignalId ?? prefill?.sourceSignalId ?? null,
    },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          title: value.title,
          pipelineId: value.pipelineId,
          stageId: value.stageId,
          companyId: value.companyId,
          companyAccountId: value.companyAccountId,
          departmentId: value.departmentId,
          responsibleUserId: value.responsibleUserId,
          budget: value.budget || null,
          description: value.description || null,
          dueDate: value.dueDate || null,
          sourceType: value.sourceType,
          sourceLeadId: value.sourceLeadId,
          sourceSignalId: value.sourceSignalId,
        }

        if (item) {
          await updateInitiative({ data: { id: item.id, ...payload } })
          toast.success('Инициатива обновлена')
          onSuccess?.()
        } else if (customSubmitFn) {
          const result = await customSubmitFn(payload)
          toast.success('Инициатива создана')
          onSuccess?.(result.id)
        } else {
          const result = await addInitiative({ data: payload })
          toast.success('Инициатива создана')
          onSuccess?.(result.id)
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Произошла ошибка',
        )
      }
    },
  })

  // Derive stages for the currently selected pipeline
  const currentPipelineId = useStore(form.store, (s) => s.values.pipelineId)
  const availableStages =
    options.pipelines.find((p) => p.id === currentPipelineId)?.stages ?? []

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      {/* Title */}
      <form.Field name="title">
        {(field) => (
          <Field
            data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
          >
            <FieldLabel htmlFor={field.name}>Название *</FieldLabel>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Название инициативы"
            />
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      {!hidePipelineStage && (
      <div className="grid grid-cols-2 gap-4">
        {/* Pipeline */}
        <form.Field name="pipelineId">
          {(field) => (
            <Field>
              <FieldLabel>Воронка</FieldLabel>
              <Select
                value={field.state.value ?? NULLABLE}
                onValueChange={(v) => {
                  const nextPipelineId = v === NULLABLE ? null : v
                  field.handleChange(nextPipelineId)
                  // Reset stage on user-driven pipeline change so it can't
                  // dangle pointing to a stage from the previous pipeline.
                  form.setFieldValue('stageId', null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите воронку" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULLABLE}>Не выбрана</SelectItem>
                  {options.pipelines.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        {/* Stage */}
        <form.Field name="stageId">
          {(field) => (
            <Field>
              <FieldLabel>Этап</FieldLabel>
              <Select
                value={field.state.value ?? NULLABLE}
                onValueChange={(v) =>
                  field.handleChange(v === NULLABLE ? null : v)
                }
                disabled={availableStages.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите этап" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULLABLE}>Не выбран</SelectItem>
                  {availableStages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>
      </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Company */}
        <form.Field name="companyId">
          {(field) => (
            <Field>
              <FieldLabel>Компания</FieldLabel>
              <Select
                value={field.state.value ?? NULLABLE}
                onValueChange={(v) =>
                  field.handleChange(v === NULLABLE ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Не выбрана" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULLABLE}>Не выбрана</SelectItem>
                  {options.companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        {/* Responsible */}
        <form.Field name="responsibleUserId">
          {(field) => (
            <Field>
              <FieldLabel>Ответственный</FieldLabel>
              <Select
                value={field.state.value ?? NULLABLE}
                onValueChange={(v) =>
                  field.handleChange(v === NULLABLE ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Не выбран" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULLABLE}>Не выбран</SelectItem>
                  {options.users.map((u) => (
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
        {/* Department */}
        <form.Field name="departmentId">
          {(field) => (
            <Field>
              <FieldLabel>Подразделение</FieldLabel>
              <Select
                value={field.state.value ?? NULLABLE}
                onValueChange={(v) =>
                  field.handleChange(v === NULLABLE ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Не выбрано" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULLABLE}>Не выбрано</SelectItem>
                  {options.departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        {/* Budget */}
        <form.Field name="budget">
          {(field) => (
            <Field>
              <FieldLabel>Бюджет (₽)</FieldLabel>
              <Input
                type="number"
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="0"
              />
            </Field>
          )}
        </form.Field>
      </div>

      {/* Due date */}
      <form.Field name="dueDate">
        {(field) => (
          <Field>
            <FieldLabel>Срок сделки</FieldLabel>
            <Input
              type="date"
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </Field>
        )}
      </form.Field>

      {/* Description */}
      <form.Field name="description">
        {(field) => (
          <Field>
            <FieldLabel>Описание</FieldLabel>
            <Textarea
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Дополнительная информация..."
              rows={3}
            />
          </Field>
        )}
      </form.Field>

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting
              ? 'Сохранение...'
              : item
                ? 'Сохранить изменения'
                : 'Создать инициативу'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
