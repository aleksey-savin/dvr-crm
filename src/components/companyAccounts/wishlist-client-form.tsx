import * as React from 'react'
import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'

import {
  addWishlistClient,
  getCompanyById,
  getFilteredWishlistCompanies,
  getFilteredUsersByDepartments,
  updateWishlistClient,
} from '@/components/companyAccounts/actions'
import { CompanySelectStep } from '@/components/companyAccounts/company-select-step'
import { fetchDepartmentOptions } from '@/components/departments/actions'
import { useDepartmentStore } from '@/stores/department-store'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TooltipProvider } from '@/components/ui/tooltip'
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
import type { SelectCompanyAccount } from '@/db/types'
import type { CompanyOption, DepartmentOption, UserOption } from '@/types'

const formSchema = z.object({
  companyId: z.string().min(1, 'Выберите компанию'),
  businessUnitIds: z.array(z.string()).min(1, 'Выберите подразделение'),
  why: z.union([z.string(), z.undefined()]),
  wishlistOffer: z.union([z.string(), z.undefined()]),
  contactNotes: z.union([z.string(), z.undefined()]),
  wishlistState: z.enum(['active', 'basement', 'archived']),
  managerUserIds: z.array(z.string()),
})

type WishlistFormItem = Pick<
  SelectCompanyAccount,
  | 'id'
  | 'companyId'
  | 'businessUnitId'
  | 'why'
  | 'wishlistOffer'
  | 'contactNotes'
  | 'wishlistState'
> & {
  departments?: Array<{ department: DepartmentOption }>
  managers?: Array<{ user: UserOption }>
  owner?: UserOption | null
}

const WishlistClientForm = ({
  initialCompanyId,
  item,
  onSuccess,
}: {
  initialCompanyId?: string
  item?: Pick<
    WishlistFormItem,
    | 'id'
    | 'companyId'
    | 'businessUnitId'
    | 'why'
    | 'wishlistOffer'
    | 'contactNotes'
    | 'wishlistState'
    | 'departments'
    | 'managers'
    | 'owner'
  >
  onSuccess?: () => void
}) => {
  const initialManagers = React.useMemo(() => {
    if (item?.managers && item.managers.length > 0) {
      return item.managers.map(({ user }) => user)
    }

    return item?.owner ? [item.owner] : []
  }, [item])
  const initialDepartments = React.useMemo(() => {
    if (item?.departments && item.departments.length > 0) {
      return item.departments.map(({ department }) => department)
    }

    return []
  }, [item])

  const [departments, setDepartments] = React.useState<DepartmentOption[]>([])
  const [users, setUsers] = React.useState<UserOption[]>([])
  const [selectedManagers, setSelectedManagers] =
    React.useState<UserOption[]>(initialManagers)
  const [selectedDepartments, setSelectedDepartments] =
    React.useState<DepartmentOption[]>(initialDepartments)
  const [companies, setCompanies] = React.useState<CompanyOption[]>([])
  const [companiesLoading, setCompaniesLoading] = React.useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = React.useState(
    item?.companyId ?? initialCompanyId ?? '',
  )
  const [selectedBusinessUnitIds, setSelectedBusinessUnitIds] = React.useState(
    initialDepartments.length > 0
      ? initialDepartments.map((department) => department.id)
      : item?.businessUnitId
        ? [item.businessUnitId]
        : [],
  )
  const [step, setStep] = React.useState(
    item?.companyId || initialCompanyId ? 2 : 1,
  )
  const selectedDepartmentId = useDepartmentStore(
    (state) => state.selectedDepartmentId,
  )
  const scopedDepartmentId = item ? null : selectedDepartmentId

  const lockedCompanyId = initialCompanyId ?? item?.companyId
  const isCompanyLocked = !!lockedCompanyId
  const portalRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    fetchDepartmentOptions().then(setDepartments).catch(console.error)

    if (lockedCompanyId) {
      getCompanyById({ data: { id: lockedCompanyId } })
        .then((company) => {
          setCompanies([company])
          setSelectedCompanyId(company.id)
          setStep(2)
        })
        .catch(console.error)
      return
    }

    setCompaniesLoading(true)
    getFilteredWishlistCompanies({
      data: { excludeWishlistClientId: item?.id },
    })
      .then(setCompanies)
      .catch(console.error)
      .finally(() => setCompaniesLoading(false))
  }, [lockedCompanyId, item?.id])

  const form = useForm({
    defaultValues: {
      companyId: item?.companyId ?? initialCompanyId ?? '',
      businessUnitIds:
        initialDepartments.length > 0
          ? initialDepartments.map((department) => department.id)
          : item?.businessUnitId
            ? [item.businessUnitId]
            : scopedDepartmentId
              ? [scopedDepartmentId]
              : [],
      why: item?.why ?? undefined,
      wishlistOffer: item?.wishlistOffer ?? undefined,
      contactNotes: item?.contactNotes ?? undefined,
      wishlistState: item?.wishlistState ?? 'active',
      managerUserIds: initialManagers.map((manager) => manager.id),
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (!item) {
          await addWishlistClient({
            data: {
              companyId: value.companyId,
              businessUnitIds: value.businessUnitIds,
              why: value.why,
              wishlistOffer: value.wishlistOffer,
              contactNotes: value.contactNotes,
              wishlistState: value.wishlistState,
              managerUserIds: value.managerUserIds,
            },
          })
          toast.success('Компания добавлена в вишлист')
        } else {
          await updateWishlistClient({
            data: {
              id: item.id,
              businessUnitIds: value.businessUnitIds,
              why: value.why,
              wishlistOffer: value.wishlistOffer,
              contactNotes: value.contactNotes,
              wishlistState: value.wishlistState,
              managerUserIds: value.managerUserIds,
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

  const selectCompany = React.useCallback(
    (company: CompanyOption) => {
      setCompanies((current) => {
        if (current.some((option) => option.id === company.id)) return current
        return [company, ...current]
      })
      form.setFieldValue('companyId', company.id)
      if (!item) {
        const nextBusinessUnitIds = scopedDepartmentId
          ? [scopedDepartmentId]
          : []
        form.setFieldValue('businessUnitIds', nextBusinessUnitIds)
        form.setFieldValue('managerUserIds', [])
        setSelectedManagers([])
        setSelectedDepartments((current) =>
          current.filter((department) =>
            nextBusinessUnitIds.includes(department.id),
          ),
        )
        setSelectedBusinessUnitIds(nextBusinessUnitIds)
      }
      setSelectedCompanyId(company.id)
      setStep(2)
    },
    [form, item, scopedDepartmentId],
  )

  React.useEffect(() => {
    if (!scopedDepartmentId) return

    if (selectedBusinessUnitIds.length > 0) return

    form.setFieldValue('businessUnitIds', [scopedDepartmentId])
    setSelectedBusinessUnitIds([scopedDepartmentId])
    const scopedDepartment = departments.find(
      (department) => department.id === scopedDepartmentId,
    )
    if (scopedDepartment) setSelectedDepartments([scopedDepartment])
  }, [departments, form, scopedDepartmentId, selectedBusinessUnitIds.length])

  React.useEffect(() => {
    if (selectedBusinessUnitIds.length === 0) return
    if (selectedDepartments.length === selectedBusinessUnitIds.length) return

    const nextDepartments = departments.filter((department) =>
      selectedBusinessUnitIds.includes(department.id),
    )
    if (nextDepartments.length > 0) setSelectedDepartments(nextDepartments)
  }, [departments, selectedBusinessUnitIds, selectedDepartments.length])

  React.useEffect(() => {
    if (selectedBusinessUnitIds.length === 0 || !selectedCompanyId) {
      setUsers([])
      return
    }

    getFilteredUsersByDepartments({
      data: { businessUnitIds: selectedBusinessUnitIds },
    })
      .then(setUsers)
      .catch(console.error)
  }, [selectedBusinessUnitIds, selectedCompanyId])

  React.useEffect(() => {
    form.setFieldValue(
      'managerUserIds',
      selectedManagers.map((manager) => manager.id),
    )
  }, [form, selectedManagers])

  return (
    <TooltipProvider>
      <div ref={portalRef} />
      <form
        id="wishlist-client-form"
        className="flex-1 flex min-h-0 flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
          <form.Field
            name="companyId"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid

              return (
                <Field data-invalid={isInvalid}>
                  <CompanySelectStep
                    companies={companies}
                    loading={companiesLoading}
                    selectedCompanyId={field.state.value}
                    locked={isCompanyLocked}
                    onSelect={(company) => {
                      field.handleChange(company.id)
                      selectCompany(company)
                    }}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />

          {step === 2 && (
            <>
              <form.Field
                name="businessUnitIds"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>Подразделения *</FieldLabel>
                      <Combobox
                        items={departments}
                        itemToStringValue={(department) => department.name}
                        isItemEqualToValue={(a, b) => a.id === b.id}
                        multiple
                        value={selectedDepartments}
                        onValueChange={(value) => {
                          const ids = value.map((department) => department.id)
                          field.handleChange(ids)
                          setSelectedDepartments(value)
                          setSelectedBusinessUnitIds(ids)
                          form.setFieldValue('managerUserIds', [])
                          setSelectedManagers([])
                        }}
                        disabled={!selectedCompanyId}
                      >
                        <ComboboxChips aria-invalid={isInvalid}>
                          <ComboboxValue>
                            {(value: DepartmentOption[]) =>
                              value.map((department) => (
                                <ComboboxChip key={department.id}>
                                  {department.name}
                                </ComboboxChip>
                              ))
                            }
                          </ComboboxValue>
                          <ComboboxChipsInput placeholder="Добавить подразделение" />
                        </ComboboxChips>
                        <ComboboxContent container={portalRef.current}>
                          <ComboboxEmpty>
                            Подразделения не найдены
                          </ComboboxEmpty>
                          <ComboboxList>
                            {(department) => (
                              <ComboboxItem
                                key={department.id}
                                value={department}
                              >
                                {department.name}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Field
                name="wishlistState"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Статус</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(
                            value as 'active' | 'basement' | 'archived',
                          )
                        }
                      >
                        <SelectTrigger
                          id={field.name}
                          aria-invalid={isInvalid}
                          className="w-full"
                          onBlur={field.handleBlur}
                        >
                          <SelectValue placeholder="Выберите статус" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Активный</SelectItem>
                          <SelectItem value="basement">Подвал</SelectItem>
                          <SelectItem value="archived">Архив</SelectItem>
                        </SelectContent>
                      </Select>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Field
                name="managerUserIds"
                children={() => (
                  <Field>
                    <FieldLabel>Ответственные</FieldLabel>
                    <Combobox
                      items={users}
                      itemToStringValue={(user) => user.name}
                      isItemEqualToValue={(a, b) => a.id === b.id}
                      multiple
                      value={selectedManagers}
                      onValueChange={setSelectedManagers}
                      disabled={selectedBusinessUnitIds.length === 0}
                    >
                      <ComboboxChips>
                        <ComboboxValue>
                          {(value: UserOption[]) =>
                            value.map((user) => (
                              <ComboboxChip key={user.id}>
                                {user.name}
                              </ComboboxChip>
                            ))
                          }
                        </ComboboxValue>
                        <ComboboxChipsInput
                          placeholder={
                            selectedBusinessUnitIds.length === 0
                              ? 'Сначала выберите подразделение'
                              : 'Добавить ответственного'
                          }
                        />
                      </ComboboxChips>
                      <ComboboxContent container={portalRef.current}>
                        <ComboboxEmpty>Ответственные не найдены</ComboboxEmpty>
                        <ComboboxList>
                          {(user) => (
                            <ComboboxItem key={user.id} value={user}>
                              {user.name}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </Field>
                )}
              />

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
                        placeholder="Почему эта компания нам интересна..."
                        className="min-h-24 resize-none"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Field
                name="wishlistOffer"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Что будем предлагать / задачи маркетолога
                      </FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value ?? ''}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(e.target.value || undefined)
                        }
                        aria-invalid={isInvalid}
                        placeholder="Оффер, гипотезы и направление проработки..."
                        className="min-h-28 resize-none"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Field
                name="contactNotes"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Контакты</FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value ?? ''}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(e.target.value || undefined)
                        }
                        aria-invalid={isInvalid}
                        placeholder="Контакты из таблицы или первичная контактная информация..."
                        className="min-h-24 resize-none"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
            </>
          )}
        </div>

        {step === 2 && (
          <div className="flex shrink-0 justify-end border-t pt-4">
            <Button type="submit">
              {item ? 'Сохранить' : 'Добавить в вишлист'}
            </Button>
          </div>
        )}
      </form>
    </TooltipProvider>
  )
}

export default WishlistClientForm
