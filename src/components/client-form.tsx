import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { TooltipProvider } from '@/components/ui/tooltip'

import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'

import { createServerFn } from '@tanstack/react-start'
import { user, department, company, companyAccount } from '@/db/schema'
import { db } from '@/db'
import { and, eq, ne, notInArray } from 'drizzle-orm'

import { Input } from '@/components/ui/input'
import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from './ui/switch'
import { Label } from './ui/label'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const formSchema = z.object({
  businessUnitId: z.string().uuid('Выберите бизнес-юнит'),
  companyId: z.string().uuid('Выберите компанию'),
  isTarget: z.boolean(),
  isLost: z.boolean(),
  lostReasons: z.string(),
  ownerUserId: z.string(),
})

const addSchema = z.object({
  businessUnitId: z.string().uuid(),
  companyId: z.string().uuid(),
  isTarget: z.boolean(),
  isLost: z.boolean(),
  lostReasons: z.string().optional(),
  ownerUserId: z.string().optional(),
})

const updateSchema = z.object({
  id: z.string(),
  businessUnitId: z.string().uuid(),
  companyId: z.string().uuid(),
  isTarget: z.boolean(),
  isLost: z.boolean(),
  lostReasons: z.string().optional(),
  ownerUserId: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type UserOption = { id: string; name: string }
type DepartmentOption = { id: string; name: string }
type CompanyOption = { id: string; name: string }

// ---------------------------------------------------------------------------
// Server fns
// ---------------------------------------------------------------------------

const getFilteredUsers = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ businessUnitId: z.string() }))
  .handler(async ({ data }) => {
    return db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(
        and(ne(user.role, 'user'), eq(user.departmentId, data.businessUnitId)),
      )
      .orderBy(user.name)
  })

const getFilteredCompanies = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      businessUnitId: z.string(),
      excludeAccountId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    // Companies already assigned as clients to this business unit (excluding
    // the account being edited so its company stays selectable)
    const clientCompanyIds = db
      .select({ id: companyAccount.companyId })
      .from(companyAccount)
      .where(
        and(
          eq(companyAccount.businessUnitId, data.businessUnitId),
          eq(companyAccount.accountType, 'client'),
          data.excludeAccountId
            ? ne(companyAccount.id, data.excludeAccountId)
            : undefined,
        ),
      )

    // Companies already in wishlist (globally)
    const wishlistCompanyIds = db
      .select({ id: companyAccount.companyId })
      .from(companyAccount)
      .where(eq(companyAccount.accountType, 'wishlist'))

    return db
      .select({ id: company.id, name: company.name })
      .from(company)
      .where(
        and(
          notInArray(company.id, clientCompanyIds),
          notInArray(company.id, wishlistCompanyIds),
        ),
      )
      .orderBy(company.name)
  })

const getDepartments = createServerFn({ method: 'GET' }).handler(async () => {
  return db
    .select({ id: department.id, name: department.name })
    .from(department)
    .orderBy(department.name)
})

const getFilteredDepartments = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      companyId: z.string(),
      excludeAccountId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    // Business units where this company already has a client account
    // (excluding the one being edited so its business unit stays selectable)
    const existingBusinessUnitIds = db
      .select({ id: companyAccount.businessUnitId })
      .from(companyAccount)
      .where(
        and(
          eq(companyAccount.companyId, data.companyId),
          eq(companyAccount.accountType, 'client'),
          data.excludeAccountId
            ? ne(companyAccount.id, data.excludeAccountId)
            : undefined,
        ),
      )

    return db
      .select({ id: department.id, name: department.name })
      .from(department)
      .where(notInArray(department.id, existingBusinessUnitIds))
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

const addAccount = createServerFn({ method: 'POST' })
  .inputValidator(addSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(companyAccount)
      .values({
        companyId: data.companyId,
        businessUnitId: data.businessUnitId,
        accountType: 'client',
        isTarget: data.isTarget,
        isLost: data.isLost,
        lostReasons: data.lostReasons ?? null,
        ownerUserId: data.ownerUserId ?? null,
      })
      .returning({ id: companyAccount.id })
    return inserted.id
  })

const updateAccount = createServerFn({ method: 'POST' })
  .inputValidator(updateSchema)
  .handler(async ({ data }) => {
    await db
      .update(companyAccount)
      .set({
        companyId: data.companyId,
        businessUnitId: data.businessUnitId,
        isTarget: data.isTarget,
        isLost: data.isLost,
        lostReasons: data.lostReasons ?? null,
        ownerUserId: data.ownerUserId ?? null,
      })
      .where(eq(companyAccount.id, data.id))
  })

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ClientForm = ({
  item,
  initialCompanyId,
  onSuccess,
}: {
  item?: {
    id: string
    companyId: string
    businessUnitId: string
    isTarget: boolean
    isLost: boolean
    lostReasons: string | null
    ownerUserId: string | null
  }
  initialCompanyId?: string
  onSuccess?: () => void
}) => {
  const [users, setUsers] = React.useState<UserOption[]>([])
  const [companies, setCompanies] = React.useState<CompanyOption[]>([])
  const [companiesLoading, setCompaniesLoading] = React.useState(false)
  const [departments, setDepartments] = React.useState<DepartmentOption[]>([])
  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = React.useState(
    (item?.businessUnitId ?? '') as string,
  )

  // When company is pre-selected: load filtered departments and lock the
  // company field. Otherwise load all departments normally.
  React.useEffect(() => {
    if (initialCompanyId) {
      getFilteredDepartments({
        data: {
          companyId: initialCompanyId,
          excludeAccountId: item?.id,
        },
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

  // Refetch companies and users whenever the selected business unit changes
  React.useEffect(() => {
    if (!selectedBusinessUnitId) {
      if (!initialCompanyId) setCompanies([])
      setUsers([])
      return
    }
    // When company is pre-fixed, skip company refetch — just load users
    if (!initialCompanyId) {
      setCompaniesLoading(true)
      getFilteredCompanies({
        data: {
          businessUnitId: selectedBusinessUnitId,
          excludeAccountId: item?.id,
        },
      })
        .then(setCompanies)
        .catch(console.error)
        .finally(() => setCompaniesLoading(false))
    }
    getFilteredUsers({ data: { businessUnitId: selectedBusinessUnitId } })
      .then(setUsers)
      .catch(console.error)
  }, [selectedBusinessUnitId])

  const form = useForm({
    defaultValues: {
      companyId: (item?.companyId ?? initialCompanyId ?? '') as string,
      businessUnitId: (item?.businessUnitId ?? '') as string,
      isTarget: (item?.isTarget ?? false) as boolean,
      isLost: (item?.isLost ?? false) as boolean,
      lostReasons: (item?.lostReasons ?? '') as string,
      ownerUserId: (item?.ownerUserId ?? '') as string,
    },
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const ownerUserId = value.ownerUserId || undefined

      if (!item) {
        try {
          await addAccount({
            data: {
              companyId: value.companyId,
              businessUnitId: value.businessUnitId,
              isTarget: value.isTarget,
              isLost: value.isLost,
              lostReasons: value.lostReasons,
              ownerUserId,
            },
          })
          toast.success('Клиент успешно добавлен')
          onSuccess?.()
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Произошла ошибка',
          )
        }
      } else {
        try {
          await updateAccount({
            data: {
              id: item.id,
              companyId: value.companyId,
              businessUnitId: value.businessUnitId,
              isTarget: value.isTarget,
              isLost: value.isLost,
              lostReasons: value.lostReasons,
              ownerUserId,
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
      <form
        id="client-form"
        className="flex-1 flex flex-col gap-6 min-h-0"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <div className="shrink-0 flex flex-col gap-6">
          {/* Business unit */}
          <form.Field
            name="businessUnitId"
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
                      setSelectedBusinessUnitId(val)
                      // Reset dependent fields when business unit changes.
                      // Don't reset companyId if it was pre-filled from outside.
                      if (!initialCompanyId) {
                        form.setFieldValue('companyId', '')
                      }
                      form.setFieldValue('ownerUserId', '')
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

          {/* Company */}
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
                      !selectedBusinessUnitId ||
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
                            : !selectedBusinessUnitId
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

          {/* isTarget & isLost are mutually exclusive */}
          <form.Field
            name="isTarget"
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
                          form.setFieldValue('isLost', false)
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
            name="isLost"
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
                          form.setFieldValue('isTarget', false)
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

          {/* Lost reasons — shown only when isLost = true */}
          <form.Subscribe
            selector={(state) => state.values.isLost}
            children={(isLost) =>
              isLost ? (
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

          {/* Owner — single select from users in the selected business unit */}
          <form.Field
            name="ownerUserId"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Ответственный</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(val) =>
                    field.handleChange(val === '_none' ? '' : val)
                  }
                  disabled={!selectedBusinessUnitId}
                >
                  <SelectTrigger
                    id={field.name}
                    className="w-full"
                    onBlur={field.handleBlur}
                  >
                    <SelectValue
                      placeholder={
                        !selectedBusinessUnitId
                          ? 'Сначала выберите бизнес-юнит'
                          : 'Не назначен'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Не назначен</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit">{item ? 'Изменить' : 'Создать'}</Button>
          </div>
        </div>
      </form>
    </TooltipProvider>
  )
}

export default ClientForm
