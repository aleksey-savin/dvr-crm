import * as React from 'react'
import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import {
  company,
  department,
  wishlistClient,
  wishlistClientDepartment,
} from '@/db/schema'
import { eq, ne, notInArray } from 'drizzle-orm'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Label } from '@/components/ui/label'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DepartmentOption = {
  id: string
  name: string
}

type CompanyOption = {
  id: string
  name: string
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const addSchema = z.object({
  companyId: z.string().min(1, 'Выберите компанию'),
  departmentIds: z
    .array(z.string())
    .min(1, 'Выберите хотя бы один бизнес-юнит'),
  why: z.string().optional(),
})

const updateSchema = z.object({
  id: z.string(),
  departmentIds: z
    .array(z.string())
    .min(1, 'Выберите хотя бы один бизнес-юнит'),
  why: z.string().optional(),
})

const formSchema = z.object({
  companyId: z.string().min(1, 'Выберите компанию'),
  departmentIds: z.array(z.string()),
  why: z.union([z.string(), z.undefined()]),
})

// ---------------------------------------------------------------------------
// Server fns
// ---------------------------------------------------------------------------

const getDepartments = createServerFn({ method: 'GET' }).handler(async () => {
  return await db
    .select({ id: department.id, name: department.name })
    .from(department)
    .orderBy(department.name)
})

const getWishlistClientDepartments = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ wishlistClientId: z.string() }))
  .handler(async ({ data }) => {
    return await db
      .select({ departmentId: wishlistClientDepartment.departmentId })
      .from(wishlistClientDepartment)
      .where(
        eq(wishlistClientDepartment.wishlistClientId, data.wishlistClientId),
      )
  })

// Companies NOT yet in the wishlist at all.
// When editing, the current entry's company is kept selectable.
const getFilteredWishlistCompanies = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      excludeWishlistClientId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const excludedCompanyIds = db
      .select({ id: wishlistClient.companyId })
      .from(wishlistClient)
      .where(
        data.excludeWishlistClientId
          ? ne(wishlistClient.id, data.excludeWishlistClientId)
          : undefined,
      )

    return await db
      .select({ id: company.id, name: company.name })
      .from(company)
      .where(notInArray(company.id, excludedCompanyIds))
      .orderBy(company.name)
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

const addWishlistClient = createServerFn({ method: 'POST' })
  .inputValidator(addSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(wishlistClient)
      .values({
        companyId: data.companyId,
        why: data.why ?? null,
      })
      .returning({ id: wishlistClient.id })

    if (data.departmentIds.length > 0) {
      await db.insert(wishlistClientDepartment).values(
        data.departmentIds.map((departmentId) => ({
          wishlistClientId: inserted.id,
          departmentId,
        })),
      )
    }

    return inserted.id
  })

const updateWishlistClient = createServerFn({ method: 'POST' })
  .inputValidator(updateSchema)
  .handler(async ({ data }) => {
    await db
      .update(wishlistClient)
      .set({ why: data.why ?? null })
      .where(eq(wishlistClient.id, data.id))

    // Replace departments
    await db
      .delete(wishlistClientDepartment)
      .where(eq(wishlistClientDepartment.wishlistClientId, data.id))

    if (data.departmentIds.length > 0) {
      await db.insert(wishlistClientDepartment).values(
        data.departmentIds.map((departmentId) => ({
          wishlistClientId: data.id,
          departmentId,
        })),
      )
    }
  })

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WishlistClientForm = ({
  initialCompanyId,
  item,
  onSuccess,
}: {
  initialCompanyId?: string
  item?: {
    id: string
    companyId: string
    why: string | null
  }
  onSuccess?: () => void
}) => {
  const [departments, setDepartments] = React.useState<DepartmentOption[]>([])
  const [selectedDepartments, setSelectedDepartments] = React.useState<
    DepartmentOption[]
  >([])
  const [companies, setCompanies] = React.useState<CompanyOption[]>([])
  const [companiesLoading, setCompaniesLoading] = React.useState(false)
  const portalRef = React.useRef<HTMLDivElement>(null)

  const isLocked = !!initialCompanyId

  // On mount: load all departments; pre-load the locked company if provided
  React.useEffect(() => {
    getDepartments().then(setDepartments).catch(console.error)

    if (initialCompanyId) {
      getCompanyById({ data: { id: initialCompanyId } })
        .then((c) => {
          if (c) setCompanies([c])
        })
        .catch(console.error)
    }
  }, [])

  // Pre-populate selected departments when editing an existing entry
  React.useEffect(() => {
    if (!item?.id || departments.length === 0) return
    getWishlistClientDepartments({ data: { wishlistClientId: item.id } })
      .then((rows) => {
        const ids = new Set(rows.map((r) => r.departmentId))
        setSelectedDepartments(departments.filter((d) => ids.has(d.id)))
      })
      .catch(console.error)
  }, [item?.id, departments])

  // Load filtered companies once on mount (skip if company is locked)
  React.useEffect(() => {
    if (isLocked) return
    setCompaniesLoading(true)
    getFilteredWishlistCompanies({
      data: { excludeWishlistClientId: item?.id },
    })
      .then(setCompanies)
      .catch(console.error)
      .finally(() => setCompaniesLoading(false))
  }, [])

  const form = useForm({
    defaultValues: {
      companyId: (item?.companyId ?? initialCompanyId ?? '') as string,
      departmentIds: [] as string[],
      why: (item?.why ?? undefined) as string | undefined,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const departmentIds = selectedDepartments.map((d) => d.id)

      if (departmentIds.length === 0) {
        toast.error('Выберите хотя бы один бизнес-юнит')
        return
      }

      try {
        if (!item) {
          await addWishlistClient({
            data: {
              companyId: value.companyId,
              departmentIds,
              why: value.why,
            },
          })
          toast.success('Компания добавлена в вишлист')
        } else {
          await updateWishlistClient({
            data: {
              id: item.id,
              departmentIds,
              why: value.why,
            },
          })
          toast.success('Запись вишлиста обновлена')
        }
        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
      }
    },
  })

  return (
    <TooltipProvider>
      <div ref={portalRef} />
      <form
        id="wishlist-client-form"
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        {/* Departments multi-select — drives company filtering */}
        <div className="flex flex-col gap-1.5">
          <Label>Бизнес-юниты *</Label>
          <Combobox
            items={departments}
            itemToStringValue={(d) => d.name}
            isItemEqualToValue={(a, b) => a.id === b.id}
            multiple
            value={selectedDepartments}
            onValueChange={(next) => {
              setSelectedDepartments(next)
            }}
          >
            <ComboboxChips>
              <ComboboxValue>
                {(value: DepartmentOption[]) =>
                  value.map((d) => (
                    <ComboboxChip key={d.id}>{d.name}</ComboboxChip>
                  ))
                }
              </ComboboxValue>
              <ComboboxChipsInput placeholder="Добавить бизнес-юнит" />
            </ComboboxChips>
            <ComboboxContent container={portalRef.current}>
              <ComboboxEmpty>Бизнес-юниты не найдены</ComboboxEmpty>
              <ComboboxList>
                {(d) => (
                  <ComboboxItem key={d.id} value={d}>
                    {d.name}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        {/* Company select */}
        <form.Field
          name="companyId"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Компания *</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(val) => field.handleChange(val)}
                  disabled={isLocked || companiesLoading}
                >
                  <SelectTrigger
                    id={field.name}
                    aria-invalid={isInvalid}
                    className="w-full"
                    onBlur={field.handleBlur}
                  >
                    <SelectValue
                      placeholder={
                        isLocked
                          ? (companies[0]?.name ?? 'Загрузка…')
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

        {/* Why */}
        <form.Field
          name="why"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Почему мы</FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(e.target.value || undefined)
                  }
                  aria-invalid={isInvalid}
                  placeholder="Почему эта компания нам интересна…"
                  className="min-h-24 resize-none"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <div className="flex justify-end">
          <Button type="submit">
            {item ? 'Сохранить' : 'Добавить в вишлист'}
          </Button>
        </div>
      </form>
    </TooltipProvider>
  )
}

export default WishlistClientForm
