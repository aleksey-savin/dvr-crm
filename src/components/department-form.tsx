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

import { RichTextEditor } from '@/components/tiptap/rich-text-editor'

import { createServerFn } from '@tanstack/react-start'
import { department, user } from '@/db/schema'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { roleLabels } from '@/utils/roleLabels'

import { Input } from '@/components/ui/input'

const ROOT_PARENT_VALUE = '__root__'
const NO_HEAD_USER_VALUE = '__no_head__'
const DEFAULT_ACCENT_COLOR = '#38BDF8'
const parentIdSchema = z.union([z.string().uuid(), z.undefined()])
const headUserIdSchema = z.union([z.string().min(1), z.undefined()])
const accentColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Цвет должен быть в формате #RRGGBB')

const formSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  headUserId: headUserIdSchema,
  description: z.union([
    z.string().min(2, 'Описание должно содержать минимум 2 символа'),
    z.undefined(),
  ]),
  accentColor: accentColorSchema,
  parentId: parentIdSchema,
})

const addSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  headUserId: headUserIdSchema,
  description: z
    .string()
    .min(2, 'Описание должно содержать минимум 2 символа')
    .optional(),
  accentColor: accentColorSchema,
  parentId: parentIdSchema,
})

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  headUserId: headUserIdSchema,
  description: z
    .string()
    .min(2, 'Описание должно содержать минимум 2 символа')
    .optional(),
  accentColor: accentColorSchema,
  parentId: parentIdSchema,
})

type ParentDepartmentRow = {
  id: string
  name: string
  parentId: string | null
}

type ParentDepartmentOption = ParentDepartmentRow & {
  depth: number
}

type HeadUserOption = {
  id: string
  name: string
  role: string
}

function getExcludedDepartmentIds(
  rows: ParentDepartmentRow[],
  excludeId?: string,
) {
  const excludedIds = new Set<string>()
  if (!excludeId) return excludedIds

  const childrenByParentId = new Map<string, ParentDepartmentRow[]>()
  for (const row of rows) {
    if (!row.parentId) continue
    const siblings = childrenByParentId.get(row.parentId) ?? []
    siblings.push(row)
    childrenByParentId.set(row.parentId, siblings)
  }

  const stack = [excludeId]
  while (stack.length > 0) {
    const id = stack.pop()
    if (!id || excludedIds.has(id)) continue

    excludedIds.add(id)
    for (const child of childrenByParentId.get(id) ?? []) {
      stack.push(child.id)
    }
  }

  return excludedIds
}

function buildParentDepartmentOptions(
  rows: ParentDepartmentRow[],
  excludeId?: string,
) {
  const excludedIds = getExcludedDepartmentIds(rows, excludeId)
  const allowedRows = rows.filter((row) => !excludedIds.has(row.id))
  const allowedIds = new Set(allowedRows.map((row) => row.id))
  const childrenByParentId = new Map<string | null, ParentDepartmentRow[]>()

  for (const row of allowedRows) {
    const parentId =
      row.parentId && allowedIds.has(row.parentId) ? row.parentId : null
    const siblings = childrenByParentId.get(parentId) ?? []
    siblings.push(row)
    childrenByParentId.set(parentId, siblings)
  }

  for (const siblings of childrenByParentId.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }

  const options: ParentDepartmentOption[] = []
  const appendOptions = (items: ParentDepartmentRow[], depth: number) => {
    for (const item of items) {
      options.push({ ...item, depth })
      appendOptions(childrenByParentId.get(item.id) ?? [], depth + 1)
    }
  }

  appendOptions(childrenByParentId.get(null) ?? [], 0)
  return options
}

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

async function validateDepartmentParent(
  parentId?: string,
  departmentId?: string,
) {
  if (!parentId) return null

  if (departmentId && parentId === departmentId) {
    throw new Error('Подразделение не может быть родителем самого себя')
  }

  const rows = await db
    .select({
      id: department.id,
      name: department.name,
      parentId: department.parentId,
    })
    .from(department)
    .orderBy(department.name)

  const byId = new Map(rows.map((row) => [row.id, row]))
  if (!byId.has(parentId)) {
    throw new Error('Родительское подразделение не найден')
  }

  const visitedIds = new Set<string>()
  let currentParentId: string | null = parentId

  while (currentParentId) {
    if (departmentId && currentParentId === departmentId) {
      throw new Error(
        'Нельзя перенести подразделение внутрь его дочернего подразделения',
      )
    }

    if (visitedIds.has(currentParentId)) {
      throw new Error('В иерархии подразделений обнаружен цикл')
    }

    visitedIds.add(currentParentId)
    currentParentId = byId.get(currentParentId)?.parentId ?? null
  }

  return parentId
}

async function validateDepartmentHead(headUserId?: string) {
  if (!headUserId) return null

  const head = await db.query.user.findFirst({
    columns: { id: true },
    where: eq(user.id, headUserId),
  })

  if (!head) {
    throw new Error('Руководитель не найден')
  }

  return headUserId
}

const fetchParentDepartmentOptions = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ excludeId: z.string().optional() }))
  .handler(async ({ data }) => {
    const rows = await db
      .select({
        id: department.id,
        name: department.name,
        parentId: department.parentId,
      })
      .from(department)
      .orderBy(department.name)

    return buildParentDepartmentOptions(rows, data.excludeId)
  })

const fetchHeadUserOptions = createServerFn({ method: 'GET' }).handler(
  async () => {
    return await db
      .select({
        id: user.id,
        name: user.name,
        role: user.role,
      })
      .from(user)
      .orderBy(user.name)
  },
)

const addDepartment = createServerFn({ method: 'POST' })
  .inputValidator(addSchema)
  .handler(async ({ data }) => {
    const parentId = await validateDepartmentParent(data.parentId)
    const headUserId = await validateDepartmentHead(data.headUserId)

    const [inserted] = await db
      .insert(department)
      .values({
        name: data.name,
        headUserId,
        description: data.description,
        accentColor: data.accentColor,
        parentId,
      })
      .returning({ id: department.id })
    return inserted.id
  })

const updateDepartment = createServerFn({ method: 'POST' })
  .inputValidator(updateSchema)
  .handler(async ({ data }) => {
    const parentId = await validateDepartmentParent(data.parentId, data.id)
    const headUserId = await validateDepartmentHead(data.headUserId)

    await db
      .update(department)
      .set({
        name: data.name,
        headUserId,
        description: data.description,
        accentColor: data.accentColor,
        parentId,
      })
      .where(eq(department.id, data.id))
  })

const DepartmentForm = ({
  item,
  initialParentId,
  onSuccess,
}: {
  item?: any
  initialParentId?: string
  onSuccess?: () => void
}) => {
  const [parentOptions, setParentOptions] = React.useState<
    ParentDepartmentOption[]
  >([])
  const [headUserOptions, setHeadUserOptions] = React.useState<
    HeadUserOption[]
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
      name: (item?.name ?? '') as string,
      headUserId: (item?.headUserId ?? undefined) as string | undefined,
      description: item?.description as string | undefined,
      accentColor: normalizeHexColor(
        (item?.accentColor ?? DEFAULT_ACCENT_COLOR) as string,
      ),
      parentId: (item?.parentId ?? initialParentId) as string | undefined,
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
                        {option.name} · {roleLabels[option.role] ?? option.role}
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
                        <span
                          style={{
                            paddingLeft:
                              option.depth > 0
                                ? `${option.depth * 12}px`
                                : undefined,
                          }}
                        >
                          {option.name}
                        </span>
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
