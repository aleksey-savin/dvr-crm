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
import * as React from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import {
  addDepartment,
  fetchHeadUserOptions,
  fetchParentDepartmentOptions,
  updateDepartment,
} from '@/components/departments/actions'
import type { SelectDepartment } from '@/db/types'
import type { ParentDepartmentOption, UserPositionOption } from '@/types'

const ROOT_PARENT_VALUE = '__root__'
const NO_HEAD_USER_VALUE = '__no_head__'
const DEFAULT_ACCENT_COLOR = '#38BDF8'
const parentIdSchema = z.union([z.string().uuid(), z.undefined()])
const headUserIdSchema = z.union([z.string().min(1), z.undefined()])
const accentColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Цвет должен быть в формате #RRGGBB')

const DEPARTMENT_TYPE_OPTIONS = [
  { value: 'sales', label: 'Продающее' },
  { value: 'production', label: 'Производственное' },
  { value: 'administrative', label: 'Административное' },
] as const

const formSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  departmentType: z.enum(['sales', 'production', 'administrative']),
  headUserId: headUserIdSchema,
  description: z.union([
    z.string().min(2, 'Описание должно содержать минимум 2 символа'),
    z.undefined(),
  ]),
  accentColor: accentColorSchema,
  parentId: parentIdSchema,
})

function normalizeHexColor(value: string) {
  const rawValue = value.trim()
  if (!rawValue) return ''

  const hexValue = rawValue.startsWith('#') ? rawValue.slice(1) : rawValue

  if (/^[0-9A-Fa-f]{3}$/.test(hexValue)) {
    return `#${hexValue
      .split('')
      .map((char) => char + char)
      .join('')}`.toUpperCase()
  }

  if (/^[0-9A-Fa-f]{6}$/.test(hexValue)) {
    return `#${hexValue}`.toUpperCase()
  }

  return rawValue.startsWith('#') ? rawValue : `#${rawValue}`
}

function getColorPickerValue(value: string) {
  const normalizedValue = normalizeHexColor(value)

  return accentColorSchema.safeParse(normalizedValue).success
    ? normalizedValue.toLowerCase()
    : DEFAULT_ACCENT_COLOR.toLowerCase()
}

function getOptionalString(value: string | null | undefined) {
  return value || undefined
}

const DepartmentForm = ({
  item,
  initialParentId,
  onSuccess,
}: {
  item?: SelectDepartment
  initialParentId?: string
  onSuccess?: () => void
}) => {
  const [parentOptions, setParentOptions] = React.useState<
    ParentDepartmentOption[]
  >([])
  const [headUserOptions, setHeadUserOptions] = React.useState<
    UserPositionOption[]
  >([])

  React.useEffect(() => {
    let isMounted = true

    Promise.all([
      fetchParentDepartmentOptions({ data: { excludeId: item?.id } }),
      fetchHeadUserOptions(),
    ])
      .then(([nextParentOptions, nextHeadUserOptions]) => {
        if (!isMounted) return

        setParentOptions(nextParentOptions)
        setHeadUserOptions(nextHeadUserOptions)
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить данные формы',
        )
      })

    return () => {
      isMounted = false
    }
  }, [item?.id])

  const form = useForm({
    defaultValues: {
      name: item?.name ?? '',
      departmentType: (item?.departmentType ?? 'sales') as 'sales' | 'production' | 'administrative',
      headUserId: getOptionalString(item?.headUserId),
      description: getOptionalString(item?.description),
      accentColor: normalizeHexColor(item?.accentColor ?? DEFAULT_ACCENT_COLOR),
      parentId: getOptionalString(item?.parentId) ?? initialParentId,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (!item) {
        try {
          await addDepartment({
            data: {
              name: value.name,
              departmentType: value.departmentType,
              headUserId: value.headUserId,
              description: value.description,
              accentColor: normalizeHexColor(value.accentColor),
              parentId: value.parentId,
            },
          })
          toast.success('Подразделение успешно создано')
          onSuccess?.()
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Произошла ошибка',
          )
        }
      } else {
        try {
          await updateDepartment({
            data: {
              id: item.id,
              name: value.name,
              departmentType: value.departmentType,
              headUserId: value.headUserId,
              description: value.description,
              accentColor: normalizeHexColor(value.accentColor),
              parentId: value.parentId,
            },
          })

          toast.success('Подразделение успешно изменен')
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
        id="department-form"
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
                  placeholder="Наименование подразделения"
                  autoComplete="off"
                  type="text"
                  required
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="departmentType"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid} className="shrink-0">
                <FieldLabel htmlFor={field.name}>Тип подразделения</FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as 'sales' | 'production' | 'administrative')
                  }
                >
                  <SelectTrigger
                    id={field.name}
                    className="w-full"
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                  >
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="headUserId"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid} className="shrink-0">
                <FieldLabel htmlFor={field.name}>Руководитель</FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value ?? NO_HEAD_USER_VALUE}
                  onValueChange={(value) => {
                    field.handleChange(
                      value === NO_HEAD_USER_VALUE ? undefined : value,
                    )
                  }}
                >
                  <SelectTrigger
                    id={field.name}
                    className="w-full"
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                  >
                    <SelectValue placeholder="Выберите руководителя" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_HEAD_USER_VALUE}>
                      Без руководителя
                    </SelectItem>
                    {headUserOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                        {option.position ? ` · ${option.position}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="parentId"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid} className="shrink-0">
                <FieldLabel htmlFor={field.name}>
                  Родительское подразделение
                </FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value ?? ROOT_PARENT_VALUE}
                  onValueChange={(value) => {
                    field.handleChange(
                      value === ROOT_PARENT_VALUE ? undefined : value,
                    )
                  }}
                >
                  <SelectTrigger
                    id={field.name}
                    className="w-full"
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                  >
                    <SelectValue placeholder="Выберите родителя" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROOT_PARENT_VALUE}>
                      Без родителя
                    </SelectItem>
                    {parentOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {`${'\u00A0'.repeat(option.depth * 2)}${option.name}`}
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
        {/* <form.Field
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
        /> */}
        <form.Field
          name="accentColor"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            const colorPickerValue = getColorPickerValue(field.state.value)

            return (
              <Field data-invalid={isInvalid} className="shrink-0">
                <FieldLabel htmlFor={field.name}>Акцентный цвет</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id={`${field.name}-picker`}
                    name={`${field.name}-picker`}
                    value={colorPickerValue}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(e.target.value.toUpperCase())
                    }
                    aria-label="Выбрать акцентный цвет"
                    className="h-9 w-12 shrink-0 cursor-pointer p-1"
                    type="color"
                  />
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={(e) => {
                      field.handleChange(normalizeHexColor(e.target.value))
                      field.handleBlur()
                    }}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="#38BDF8"
                    autoComplete="off"
                    type="text"
                    required
                  />
                </div>
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

export default DepartmentForm
