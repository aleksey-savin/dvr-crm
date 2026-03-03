import { Button } from '@/components/ui/button'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'

import { TooltipProvider } from '@/components/ui/tooltip'

import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'

import { createServerFn } from '@tanstack/react-start'
import {
  user,
  department,
  company,
  client,
  clientManager,
  wishlistClient,
} from '@/db/schema'
import { db } from '@/db'
import { and, eq, ne, notInArray } from 'drizzle-orm'

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
import { Switch } from './ui/switch'
import { Label } from './ui/label'

const formSchema = z.object({
  companyId: z.string().uuid('Выберите компанию'),
  departmentId: z.string().uuid('Выберите бизнес-юнит'),
  target: z.boolean(),
  lost: z.boolean(),
  lostReasons: z.string(),
})

const addSchema = z.object({
  companyId: z.string().uuid('Выберите компанию'),
  departmentId: z.string().uuid('Выберите бизнес-юнит'),
  target: z.boolean(),
  lost: z.boolean(),
  lostReasons: z.string().optional(),
})

const updateSchema = z.object({
  id: z.string(),
  companyId: z.string().uuid('Выберите компанию'),
  departmentId: z.string().uuid('Выберите бизнес-юнит'),
  target: z.boolean(),
  lost: z.boolean(),
  lostReasons: z.string().optional(),
})

type UserOption = {
  id: string
  name: string
}

type DepartmentOption = {
  id: string
  name: string
}

type CompanyOption = {
  id: string
  name: string
}

const getFilteredUsers = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ departmentId: z.string() }))
  .handler(async ({ data }) => {
    const users = await db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(
        and(ne(user.role, 'user'), eq(user.departmentId, data.departmentId)),
      )
      .orderBy(user.name)
    return users
  })

const getFilteredCompanies = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      departmentId: z.string(),
      excludeClientId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    // Companies already assigned as clients to this department, excluding the
    // client currently being edited so its company remains selectable
    const clientCompanyIds = db
      .select({ id: client.companyId })
      .from(client)
      .where(
        and(
          eq(client.departmentId, data.departmentId),
          data.excludeClientId
            ? ne(client.id, data.excludeClientId)
            : undefined,
        ),
      )

    // Companies already in wishlist (globally)
    const wishlistCompanyIds = db
      .select({ id: wishlistClient.companyId })
      .from(wishlistClient)

    const companies = await db
      .select({ id: company.id, name: company.name })
      .from(company)
      .where(
        and(
          notInArray(company.id, clientCompanyIds),
          notInArray(company.id, wishlistCompanyIds),
        ),
      )
      .orderBy(company.name)
    return companies
  })

const getDepartments = createServerFn({ method: 'GET' }).handler(async () => {
  const departments = await db
    .select({ id: department.id, name: department.name })
    .from(department)
    .orderBy(department.name)
  return departments
})

const getFilteredDepartments = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      companyId: z.string(),
      excludeClientId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    // Departments where this company is already a client, excluding the
    // client currently being edited so its department remains selectable
    const existingDeptIds = db
      .select({ id: client.departmentId })
      .from(client)
      .where(
        and(
          eq(client.companyId, data.companyId),
          data.excludeClientId
            ? ne(client.id, data.excludeClientId)
            : undefined,
        ),
      )

    return await db
      .select({ id: department.id, name: department.name })
      .from(department)
      .where(notInArray(department.id, existingDeptIds))
      .orderBy(department.name)
  })

const getCompanyById = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const result = await db
      .select({ id: company.id, name: company.name })
      .from(company)
      .where(eq(company.id, data.id))
      .limit(1)
    return result[0] ?? null
  })

const addClient = createServerFn({ method: 'POST' })
  .inputValidator(addSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(client)
      .values({
        companyId: data.companyId,
        departmentId: data.departmentId,
        target: data.target,
        lost: data.lost,
        lostReasons: data.lostReasons ?? '',
      })
      .returning({ id: client.id })
    return inserted.id
  })

const updateClient = createServerFn({ method: 'POST' })
  .inputValidator(updateSchema)
  .handler(async ({ data }) => {
    await db
      .update(client)
      .set({
        companyId: data.companyId,
        departmentId: data.departmentId,
        target: data.target,
        lost: data.lost,
        lostReasons: data.lostReasons ?? '',
      })
      .where(eq(client.id, data.id))
  })

const setManagers = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      clientId: z.string(),
      userIds: z.array(z.string()),
    }),
  )
  .handler(async ({ data }) => {
    await db
      .delete(clientManager)
      .where(eq(clientManager.clientId, data.clientId))

    if (data.userIds.length > 0) {
      await db.insert(clientManager).values(
        data.userIds.map((userId) => ({
          clientId: data.clientId,
          userId,
        })),
      )
    }
  })

const getClientManagers = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ clientId: z.string() }))
  .handler(async ({ data }) => {
    const rows = await db
      .select({ id: user.id, name: user.name })
      .from(clientManager)
      .innerJoin(user, eq(clientManager.userId, user.id))
      .where(eq(clientManager.clientId, data.clientId))
    return rows
  })

const ClientForm = ({
  item,
  initialCompanyId,
  onSuccess,
}: {
  item?: any
  initialCompanyId?: string
  onSuccess?: () => void
}) => {
  const [users, setUsers] = React.useState<UserOption[]>([])
  const [companies, setCompanies] = React.useState<CompanyOption[]>([])
  const [companiesLoading, setCompaniesLoading] = React.useState(false)
  const [departments, setDepartments] = React.useState<DepartmentOption[]>([])
  const [selectedUsers, setSelectedUsers] = React.useState<UserOption[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState(
    (item?.departmentId ?? '') as string,
  )
  const portalRef = React.useRef<HTMLDivElement>(null)

  // When company is pre-selected: load filtered departments and lock the company
  // field. Otherwise load all departments normally.
  React.useEffect(() => {
    if (initialCompanyId) {
      getFilteredDepartments({
        data: { companyId: initialCompanyId, excludeClientId: item?.id },
      })
        .then(setDepartments)
        .catch(console.error)
      getCompanyById({ data: { id: initialCompanyId } })
        .then((c) => {
          if (c) setCompanies([c])
        })
        .catch(console.error)
    } else {
      getDepartments().then(setDepartments).catch(console.error)
    }
  }, [])

  // Refetch filtered companies and managers whenever department changes
  React.useEffect(() => {
    if (!selectedDepartmentId) {
      if (!initialCompanyId) setCompanies([])
      setUsers([])
      return
    }
    // When company is pre-fixed, skip company refetch — just load managers
    if (!initialCompanyId) {
      setCompaniesLoading(true)
      getFilteredCompanies({
        data: { departmentId: selectedDepartmentId, excludeClientId: item?.id },
      })
        .then(setCompanies)
        .catch(console.error)
        .finally(() => setCompaniesLoading(false))
    }
    getFilteredUsers({ data: { departmentId: selectedDepartmentId } })
      .then(setUsers)
      .catch(console.error)
  }, [selectedDepartmentId])

  React.useEffect(() => {
    if (item?.id) {
      getClientManagers({ data: { clientId: item.id } })
        .then(setSelectedUsers)
        .catch(console.error)
    }
  }, [item?.id])

  const form = useForm({
    defaultValues: {
      companyId: (item?.companyId ?? initialCompanyId ?? '') as string,
      departmentId: (item?.departmentId ?? '') as string,
      target: (item?.target ?? false) as boolean,
      lost: (item?.lost ?? false) as boolean,
      lostReasons: (item?.lostReasons ?? '') as string,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (!item) {
        try {
          const clientId = await addClient({
            data: {
              companyId: value.companyId,
              departmentId: value.departmentId,
              target: value.target,
              lost: value.lost,
              lostReasons: value.lostReasons,
            },
          })
          if (selectedUsers.length > 0) {
            await setManagers({
              data: {
                clientId,
                userIds: selectedUsers.map((u) => u.id),
              },
            })
          }
          toast.success('Клиент успешно добавлен')
          onSuccess?.()
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Произошла ошибка',
          )
        }
      } else {
        try {
          await updateClient({
            data: {
              id: item.id,
              companyId: value.companyId,
              departmentId: value.departmentId,
              target: value.target,
              lost: value.lost,
              lostReasons: value.lostReasons,
            },
          })
          await setManagers({
            data: {
              clientId: item.id,
              userIds: selectedUsers.map((u) => u.id),
            },
          })
          toast.success('Клиент успешно изменён')
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
      <div ref={portalRef} />
      <form
        id="client-form"
        className="flex-1 flex flex-col gap-6 min-h-0"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <div className="shrink-0 flex flex-col gap-6">
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
                      setSelectedDepartmentId(val)
                      // Reset company and managers when department changes
                      form.setFieldValue('companyId', '')
                      setSelectedUsers([])
                    }}
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
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
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
            name="companyId"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Компания</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val)}
                    disabled={
                      !!initialCompanyId ||
                      !selectedDepartmentId ||
                      companiesLoading
                    }
                  >
                    <SelectTrigger
                      id={field.name}
                      aria-invalid={isInvalid}
                      className="w-full"
                      onBlur={field.handleBlur}
                    >
                      <SelectValue
                        placeholder={
                          initialCompanyId
                            ? 'Загрузка…'
                            : !selectedDepartmentId
                              ? 'Сначала выберите бизнес-юнит'
                              : companiesLoading
                                ? 'Загрузка…'
                                : 'Выберите компанию'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />

          {/* target & lost are mutually exclusive */}
          <form.Field
            name="target"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(val: boolean) => {
                        field.handleChange(val)
                        if (val) {
                          form.setFieldValue('lost', false)
                          form.setFieldValue('lostReasons', '')
                        }
                      }}
                    />
                    <Label htmlFor={field.name}>Целевой клиент</Label>
                  </div>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />

          <form.Field
            name="lost"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(val: boolean) => {
                        field.handleChange(val)
                        if (val) {
                          form.setFieldValue('target', false)
                        } else {
                          form.setFieldValue('lostReasons', '')
                        }
                      }}
                    />
                    <Label htmlFor={field.name}>Потерянный клиент</Label>
                  </div>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />

          <form.Subscribe
            selector={(state) => state.values.lost}
            children={(lost) =>
              lost ? (
                <form.Field
                  name="lostReasons"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Причина потери
                        </FieldLabel>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="Укажите причину потери клиента"
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
              ) : null
            }
          />

          <Field>
            <FieldLabel>Клиент-менеджеры</FieldLabel>
            <Combobox
              items={users}
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
                      {u.name}
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

export default ClientForm
