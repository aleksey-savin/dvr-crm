import * as React from 'react'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  addSalesPlan,
  fetchDepartmentManagers,
  updateSalesPlan,
} from '@/components/reports/actions'
import type { SalesPlanRow } from '@/types'

const formSchema = z.object({
  departmentId: z.string().min(1, 'Выберите подразделение'),
  userId: z.string().min(1, 'Выберите менеджера'),
  year: z.number().int().min(2000).max(2100),
  segment: z.enum(['target', 'nontarget']),
  value: z.string().min(1, 'Укажите план'),
})

const SEGMENT_LABEL = { target: 'Целевые', nontarget: 'Нецелевые' } as const

export function SalesPlanForm({
  item,
  departments,
  onSuccess,
}: {
  item?: SalesPlanRow
  departments: Array<{ id: string; name: string }>
  onSuccess?: () => void
}) {
  const form = useForm({
    defaultValues: {
      departmentId: item?.departmentId ?? '',
      userId: item?.userId ?? '',
      year: item?.year ?? new Date().getFullYear(),
      segment: (item?.segment ?? 'target') as 'target' | 'nontarget',
      value: item?.value ?? '',
    },
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      try {
        if (item) {
          await updateSalesPlan({ data: { id: item.id, value: value.value } })
          toast.success('План обновлён')
        } else {
          await addSalesPlan({ data: value })
          toast.success('План создан')
        }
        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
      }
    },
  })

  // Mirror the selected department into local state so the dependent manager
  // query reacts to it (avoids relying on a version-specific form store API).
  const [selectedDeptId, setSelectedDeptId] = React.useState(
    item?.departmentId ?? '',
  )

  const { data: managers = [] } = useQuery({
    queryKey: ['sales-plan-managers', selectedDeptId],
    queryFn: () =>
      fetchDepartmentManagers({ data: { departmentId: selectedDeptId } }),
    enabled: Boolean(selectedDeptId) && !item,
  })

  // Edit mode: only the plan value is editable; context is shown read-only.
  if (item) {
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border p-3 text-sm">
          <span className="text-muted-foreground">Подразделение</span>
          <span>{item.departmentName}</span>
          <span className="text-muted-foreground">Менеджер</span>
          <span>{item.userName}</span>
          <span className="text-muted-foreground">Год</span>
          <span>{item.year}</span>
          <span className="text-muted-foreground">Сегмент</span>
          <span>{SEGMENT_LABEL[item.segment]}</span>
        </div>

        <form.Field name="value">
          {(field) => (
            <Field
              data-invalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
            >
              <FieldLabel htmlFor={field.name}>План (ВП), ₽ *</FieldLabel>
              <Input
                id={field.name}
                type="number"
                step="0.01"
                min="0"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="0"
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <div className="flex justify-end border-t pt-4">
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
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
      <form.Field name="departmentId">
        {(field) => (
          <Field
            data-invalid={
              field.state.meta.isTouched && !field.state.meta.isValid
            }
          >
            <FieldLabel>Подразделение *</FieldLabel>
            <Select
              value={field.state.value}
              onValueChange={(v) => {
                field.handleChange(v)
                form.setFieldValue('userId', '')
                setSelectedDeptId(v)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите бизнес-юнит" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <form.Field name="userId">
        {(field) => (
          <Field
            data-invalid={
              field.state.meta.isTouched && !field.state.meta.isValid
            }
          >
            <FieldLabel>Менеджер *</FieldLabel>
            <Select
              value={field.state.value}
              onValueChange={field.handleChange}
              disabled={!selectedDeptId || managers.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedDeptId
                      ? 'Выберите менеджера'
                      : 'Сначала подразделение'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="year">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Год *</FieldLabel>
              <Input
                id={field.name}
                type="number"
                min="2000"
                max="2100"
                value={field.state.value}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                onBlur={field.handleBlur}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Field name="segment">
          {(field) => (
            <Field>
              <FieldLabel>Сегмент *</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) =>
                  field.handleChange(v as 'target' | 'nontarget')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="target">Целевые</SelectItem>
                  <SelectItem value="nontarget">Нецелевые</SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>
      </div>

      <form.Field name="value">
        {(field) => (
          <Field
            data-invalid={
              field.state.meta.isTouched && !field.state.meta.isValid
            }
          >
            <FieldLabel htmlFor={field.name}>План (ВП), ₽ *</FieldLabel>
            <Input
              id={field.name}
              type="number"
              step="0.01"
              min="0"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="0"
            />
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <div className="flex justify-end border-t pt-4">
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Создать'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
