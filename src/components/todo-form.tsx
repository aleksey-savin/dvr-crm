import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { TooltipProvider } from '@/components/ui/tooltip'
import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { RichTextEditor } from '@/components/tiptap/rich-text-editor'
import { Badge } from '@/components/ui/badge'
import { roleLabels } from '@/utils/roleLabels'
import { useDepartmentStore } from '@/stores/department-store'
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
import {
  addTodo,
  getClients,
  getDepartments,
  getEntityManagers,
  getTodoResponsibles,
  getUsers,
  setResponsibleUsers,
  updateTodo,
} from '@/components/todos/actions'
import type { SelectTodo } from '@/db/types'
import type {
  CompanyAccountOption,
  DepartmentOption,
  UserRoleOption,
} from '@/types'

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
  departmentId: z.string().uuid('Выберите подразделение'),
  clientId: z.string(),
  wishlistClientId: z.string(),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// A user is highlighted in the responsibles combobox when:
//   - they are a marketer (department-level, always relevant), OR
//   - they are explicitly a manager of the selected client/wishlistClient
function isHighlighted(
  u: UserRoleOption,
  entityManagerIds: Set<string>,
): boolean {
  if (u.role === 'marketer') return true
  if (entityManagerIds.size > 0 && entityManagerIds.has(u.id)) return true
  return false
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TodoForm = ({
  item,
  onSuccess,
  clientId: defaultClientId,
  wishlistClientId: defaultWishlistClientId,
  wishlistClientLabel,
  defaultDepartmentId,
}: {
  item?: SelectTodo
  onSuccess?: () => void
  /** Pre-selected client when opening from the client view page */
  clientId?: string
  /** Pre-selected wishlist client when opening from the wishlist view page */
  wishlistClientId?: string
  /** Display label shown in the locked wishlist client field */
  wishlistClientLabel?: string
  defaultDepartmentId?: string
}) => {
  const { data: session } = authClient.useSession()
  const storeDepartments = useDepartmentStore((s) => s.departments)
  const globalDepartmentId = useDepartmentStore((s) => s.selectedDepartmentId)

  const [users, setUsers] = React.useState<UserRoleOption[]>([])
  const [departments, setDepartments] = React.useState<DepartmentOption[]>([])
  const [clients, setClients] = React.useState<CompanyAccountOption[]>([])
  const [selectedUsers, setSelectedUsers] = React.useState<UserRoleOption[]>([])
  const [entityManagerIds, setEntityManagerIds] = React.useState<Set<string>>(
    new Set(),
  )
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

  // Pre-load manager IDs for a locked client/wishlistClient (prop-driven, never changes)
  React.useEffect(() => {
    const clientId = item?.companyAccountId ?? defaultClientId
    const wishlistClientId = defaultWishlistClientId
    if (!clientId && !wishlistClientId) return
    getEntityManagers({ data: { clientId, wishlistClientId } })
      .then((ids) => setEntityManagerIds(new Set(ids)))
      .catch(console.error)
  }, [])

  const defaultDeadline: string | undefined = item?.deadline
    ? new Date(item.deadline).toISOString().split('T')[0]
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const form = useForm({
    defaultValues: {
      name: (item?.name ?? ''),
      description: item?.description as string | undefined,
      deadline: defaultDeadline as string | undefined,
      departmentId: (item?.departmentId ??
        defaultDepartmentId ??
        globalDepartmentId ??
        ''),
      clientId: (defaultWishlistClientId
        ? ''
        : (item?.companyAccountId ?? defaultClientId ?? '')),
      wishlistClientId: (defaultWishlistClientId ?? ''),
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const userId = session?.user.id ?? ''
      // Treat empty string as "no client"
      const resolvedClientId = value.clientId.trim() || undefined
      const resolvedWishlistClientId = value.wishlistClientId.trim() || undefined

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
              wishlistClientId: resolvedWishlistClientId,
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
              wishlistClientId: resolvedWishlistClientId,
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
                  <FieldLabel htmlFor={field.name}>Подразделение</FieldLabel>
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
                      <SelectValue placeholder="Выберите подразделение" />
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

          {/* Client (optional) — hidden when wishlistClientId is locked */}
          {defaultWishlistClientId ? (
            <Field>
              <FieldLabel>Клиент (вишлист)</FieldLabel>
              <Input
                value={wishlistClientLabel ?? defaultWishlistClientId}
                disabled
                className="bg-muted text-muted-foreground"
              />
            </Field>
          ) : (
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
                      value={field.state.value}
                      onValueChange={(val) => {
                        const newVal = val === '__none__' ? '' : val
                        field.handleChange(newVal)
                        // Re-derive highlighted managers for the newly selected client
                        if (!defaultClientId) {
                          const clientId = newVal.trim() || undefined
                          if (!clientId) {
                            setEntityManagerIds(new Set())
                          } else {
                            getEntityManagers({ data: { clientId } })
                              .then((ids) => setEntityManagerIds(new Set(ids)))
                              .catch(console.error)
                          }
                        }
                      }}
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
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          )}

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
                ...users.filter((u) => isHighlighted(u, entityManagerIds)),
                ...users.filter((u) => !isHighlighted(u, entityManagerIds)),
              ]}
              itemToStringValue={(u) => u.name}
              isItemEqualToValue={(a, b) => a.id === b.id}
              multiple
              value={selectedUsers}
              onValueChange={setSelectedUsers}
            >
              <ComboboxChips>
                <ComboboxValue>
                  {(value: UserRoleOption[]) =>
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
                        {isHighlighted(u, entityManagerIds) && (
                          <Badge
                            variant={
                              entityManagerIds.has(u.id)
                                ? 'default'
                                : 'secondary'
                            }
                            className="ml-auto h-4 px-1.5 text-[10px] leading-none shrink-0"
                          >
                            {roleLabels[u.role]}
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
