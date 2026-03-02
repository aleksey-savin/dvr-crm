import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { TooltipProvider } from '@/components/ui/tooltip'
import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { RichTextEditor } from '@/components/tiptap/rich-text-editor'
import { Badge } from '@/components/ui/badge'
import { roleLabels } from '@/utils/roleLabels'
import { createServerFn } from '@tanstack/react-start'
import { useDepartmentStore } from '@/stores/department-store'
import {
  todo,
  todoResponsibleUsers,
  user,
  department,
  client,
  company,
} from '@/db/schema'
import { db } from '@/db'
import { asc, eq } from 'drizzle-orm'
import { authClient } from 'utils/auth-client'
import { Input } from '@/components/ui/input'
import * as React from 'react'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@/components/ui/combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const formSchema = z.object({
  name: z.string().min(2, 'Задача должна содержать минимум 2 символа'),
  description: z.union([
    z.string().min(2, 'Описание должно содержать минимум 2 символа'),
    z.undefined(),
  ]),
  deadline: z.union([z.string(), z.undefined()]),
  departmentId: z.string().uuid('Выберите бизнес-юнит'),
  clientId: z.string(),
})

const addSchema = z.object({
  name: z.string().min(2, 'Задача должна содержать минимум 2 символа'),
  description: z
    .string()
    .min(2, 'Описание должно содержать минимум 2 символа')
    .optional(),
  departmentId: z.string().uuid(),
  responsibles: z.array(z.string()).optional(),
  createdBy: z.string(),
  deadline: z.string().optional(),
  clientId: z.string().optional(),
})

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Задача должна содержать минимум 2 символа'),
  description: z
    .string()
    .min(2, 'Описание должно содержать минимум 2 символа')
    .optional(),
  departmentId: z.string().uuid(),
  responsibles: z.array(z.string()).optional(),
  createdBy: z.string(),
  deadline: z.string().optional(),
  clientId: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UserOption = {
  id: string
  name: string
  role: string
}

type DepartmentOption = {
  id: string
  name: string
}

type ClientOption = {
  id: string
  companyName: string | null
}

// ---------------------------------------------------------------------------
// Server fns
// ---------------------------------------------------------------------------

const HIGHLIGHTED_ROLES = ['manager', 'marketer'] as const

const getUsers = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ departmentId: z.string() }))
  .handler(async ({ data }) => {
    const users = await db
      .select({ id: user.id, name: user.name, role: user.role })
      .from(user)
      .where(eq(user.departmentId, data.departmentId))
      .orderBy(user.name)
    return users
  })

const getDepartments = createServerFn({ method: 'GET' }).handler(async () => {
  const departments = await db
    .select({ id: department.id, name: department.name })
    .from(department)
    .orderBy(department.name)
  return departments
})

const getClients = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ departmentId: z.string().optional() }))
  .handler(async ({ data }) => {
    const rows = await db
      .select({
        id: client.id,
        companyName: company.name,
      })
      .from(client)
      .leftJoin(company, eq(client.companyId, company.id))
      .where(
        data.departmentId
          ? eq(client.departmentId, data.departmentId)
          : undefined,
      )
      .orderBy(asc(company.name))
    return rows
  })

const addTodo = createServerFn({ method: 'POST' })
  .inputValidator(addSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(todo)
      .values({
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        departmentId: data.departmentId,
        ...(data.deadline ? { deadline: new Date(data.deadline) } : {}),
        ...(data.clientId ? { clientId: data.clientId } : {}),
      })
      .returning({ id: todo.id })
    return inserted.id
  })

const updateTodo = createServerFn({ method: 'POST' })
  .inputValidator(updateSchema)
  .handler(async ({ data }) => {
    await db
      .update(todo)
      .set({
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        departmentId: data.departmentId,
        ...(data.deadline ? { deadline: new Date(data.deadline) } : {}),
        ...(data.clientId ? { clientId: data.clientId } : { clientId: null }),
      })
      .where(eq(todo.id, data.id))
  })

const setResponsibleUsers = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      todoId: z.string(),
      userIds: z.array(z.string()),
    }),
  )
  .handler(async ({ data }) => {
    await db
      .delete(todoResponsibleUsers)
      .where(eq(todoResponsibleUsers.todoId, data.todoId))

    if (data.userIds.length > 0) {
      await db.insert(todoResponsibleUsers).values(
        data.userIds.map((userId) => ({
          todoId: data.todoId,
          userId,
        })),
      )
    }
  })

const getTodoResponsibles = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ todoId: z.string() }))
  .handler(async ({ data }) => {
    const rows = await db
      .select({ id: user.id, name: user.name, role: user.role })
      .from(todoResponsibleUsers)
      .innerJoin(user, eq(todoResponsibleUsers.userId, user.id))
      .where(eq(todoResponsibleUsers.todoId, data.todoId))
    return rows
  })

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TodoForm = ({
  item,
  onSuccess,
  clientId: defaultClientId,
  defaultDepartmentId,
}: {
  item?: any
  onSuccess?: () => void
  /** Pre-selected client when opening from the client view page */
  clientId?: string
  defaultDepartmentId?: string
}) => {
  const { data: session } = authClient.useSession()
  const storeDepartments = useDepartmentStore((s) => s.departments)
  const globalDepartmentId = useDepartmentStore((s) => s.selectedDepartmentId)

  const [users, setUsers] = React.useState<UserOption[]>([])
  const [departments, setDepartments] = React.useState<DepartmentOption[]>([])
  const [clients, setClients] = React.useState<ClientOption[]>([])
  const [selectedUsers, setSelectedUsers] = React.useState<UserOption[]>([])
  const [watchedDepartmentId, setWatchedDepartmentId] = React.useState<string>(
    item?.departmentId ?? defaultDepartmentId ?? globalDepartmentId ?? '',
  )
  const portalRef = React.useRef<HTMLDivElement>(null)

  // Prefer store departments (already fetched by sidebar), fall back to own fetch
  React.useEffect(() => {
    if (storeDepartments.length > 0) {
      setDepartments(storeDepartments)
    } else {
      getDepartments().then(setDepartments).catch(console.error)
    }
  }, [storeDepartments])

  React.useEffect(() => {
    if (item?.id) {
      getTodoResponsibles({ data: { todoId: item.id } })
        .then(setSelectedUsers)
        .catch(console.error)
    }
  }, [item?.id])

  const defaultDeadline: string | undefined = item?.deadline
    ? new Date(item.deadline).toISOString().split('T')[0]
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const form = useForm({
    defaultValues: {
      name: (item?.name ?? '') as string,
      description: item?.description as string | undefined,
      deadline: defaultDeadline as string | undefined,
      departmentId: (item?.departmentId ??
        defaultDepartmentId ??
        globalDepartmentId ??
        '') as string,
      clientId: (item?.clientId ?? defaultClientId ?? '') as string,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const userId = session?.user?.id ?? ''
      // Treat empty string as "no client"
      const resolvedClientId = value.clientId?.trim() || undefined

      if (!item) {
        try {
          const todoId = await addTodo({
            data: {
              name: value.name,
              description: value.description,
              createdBy: userId,
              departmentId: value.departmentId,
              deadline: value.deadline,
              clientId: resolvedClientId,
            },
          })
          if (selectedUsers.length > 0) {
            await setResponsibleUsers({
              data: { todoId, userIds: selectedUsers.map((u) => u.id) },
            })
          }
          toast.success('Задача успешно создана')
          onSuccess?.()
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Произошла ошибка',
          )
        }
      } else {
        try {
          await updateTodo({
            data: {
              id: item.id,
              name: value.name,
              description: value.description,
              createdBy: userId,
              departmentId: value.departmentId,
              deadline: value.deadline,
              clientId: resolvedClientId,
            },
          })
          await setResponsibleUsers({
            data: { todoId: item.id, userIds: selectedUsers.map((u) => u.id) },
          })
          toast.success('Задача успешно изменена')
          onSuccess?.()
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Произошла ошибка',
          )
        }
      }
    },
  })

  // Fetch users + clients whenever the selected department changes.
  // Clearing of dependent fields on a user-driven change is handled
  // directly in the department Select's onValueChange, so this effect
  // is purely a data-loader and never wipes a pre-selected clientId.
  React.useEffect(() => {
    if (!watchedDepartmentId) {
      setClients([])
      setUsers([])
      return
    }
    getClients({ data: { departmentId: watchedDepartmentId } })
      .then(setClients)
      .catch(console.error)
    getUsers({ data: { departmentId: watchedDepartmentId } })
      .then(setUsers)
      .catch(console.error)
  }, [watchedDepartmentId])

  // When global filter is active, restrict visible departments to the selected one
  const visibleDepartments = globalDepartmentId
    ? departments.filter((d) => d.id === globalDepartmentId)
    : departments

  return (
    <TooltipProvider>
      <div ref={portalRef} />
      <form
        id="todo-form"
        className="flex-1 flex flex-col gap-6 min-h-0"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        {/* Name */}
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid} className="shrink-0">
                <FieldLabel htmlFor={field.name}>Краткое описание</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Кратко опишите задачу"
                  autoComplete="off"
                  type="text"
                  required
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        {/* Description — grows to fill remaining space */}
        <form.Field
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
        />

        {/* Bottom fields — fixed, always visible */}
        <div className="shrink-0 flex flex-col gap-6">
          {/* Department */}
          <form.Field
            name="departmentId"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Бизнес-юнит</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => {
                      field.handleChange(val)
                      setWatchedDepartmentId(val)
                      // User explicitly changed department — clear dependent fields
                      form.setFieldValue('clientId', '')
                      setClients([])
                      setUsers([])
                      setSelectedUsers([])
                    }}
                    disabled={!!globalDepartmentId}
                  >
                    <SelectTrigger
                      id={field.name}
                      aria-invalid={isInvalid}
                      className="w-full"
                      onBlur={field.handleBlur}
                    >
                      <SelectValue placeholder="Выберите бизнес-юнит" />
                    </SelectTrigger>
                    <SelectContent>
                      {visibleDepartments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />

          {/* Client (optional) */}
          <form.Field
            name="clientId"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Клиент{' '}
                    <span className="text-muted-foreground font-normal">
                      (необязательно)
                    </span>
                  </FieldLabel>
                  <Select
                    value={field.state.value ?? ''}
                    onValueChange={(val) =>
                      field.handleChange(val === '__none__' ? '' : val)
                    }
                    disabled={!watchedDepartmentId}
                  >
                    <SelectTrigger
                      id={field.name}
                      aria-invalid={isInvalid}
                      className="w-full"
                      onBlur={field.handleBlur}
                    >
                      <SelectValue placeholder="Выберите клиента" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        <span className="text-muted-foreground">
                          — Без клиента
                        </span>
                      </SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.companyName ?? c.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />

          {/* Deadline */}
          <form.Field
            name="deadline"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Срок выполнения</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    type="date"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />

          {/* Responsible users */}
          <Field>
            <FieldLabel>Ответственные</FieldLabel>
            <Combobox
              items={[
                ...users.filter((u) =>
                  HIGHLIGHTED_ROLES.includes(
                    u.role as (typeof HIGHLIGHTED_ROLES)[number],
                  ),
                ),
                ...users.filter(
                  (u) =>
                    !HIGHLIGHTED_ROLES.includes(
                      u.role as (typeof HIGHLIGHTED_ROLES)[number],
                    ),
                ),
              ]}
              itemToStringValue={(u) => u.name}
              isItemEqualToValue={(a, b) => a.id === b.id}
              multiple
              value={selectedUsers}
              onValueChange={setSelectedUsers}
            >
              <ComboboxChips>
                <ComboboxValue>
                  {(value: UserOption[]) =>
                    value.map((u) => (
                      <ComboboxChip key={u.id}>{u.name}</ComboboxChip>
                    ))
                  }
                </ComboboxValue>
                <ComboboxChipsInput placeholder="Добавить ответственного" />
              </ComboboxChips>
              <ComboboxContent container={portalRef.current}>
                <ComboboxEmpty>Пользователи не найдены</ComboboxEmpty>
                <ComboboxList>
                  {(u) => (
                    <ComboboxItem key={u.id} value={u}>
                      <span className="flex items-center gap-2 w-full">
                        {u.name}
                        {HIGHLIGHTED_ROLES.includes(
                          u.role as (typeof HIGHLIGHTED_ROLES)[number],
                        ) && (
                          <Badge
                            variant={
                              u.role === 'manager' ? 'default' : 'secondary'
                            }
                            className="ml-auto h-4 px-1.5 text-[10px] leading-none shrink-0"
                          >
                            {roleLabels[u.role] ?? u.role}
                          </Badge>
                        )}
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>

          <div className="flex justify-end">
            <Button type="submit">{item ? 'Изменить' : 'Создать'}</Button>
          </div>
        </div>
      </form>
    </TooltipProvider>
  )
}

export default TodoForm
