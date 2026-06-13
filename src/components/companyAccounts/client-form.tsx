import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { TooltipProvider } from '@/components/ui/tooltip'

import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'

import * as React from 'react'
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
import {
  addAccount,
  getClientCandidateCompanies,
  getCompanyById,
  getFilteredDepartments,
  getFilteredUsers,
  updateAccount,
} from '@/components/companyAccounts/actions'
import { CompanySelectStep } from '@/components/companyAccounts/company-select-step'
import { useDepartmentStore } from '@/stores/department-store'
import type { SelectCompanyAccount } from '@/db/types'
import type { CompanyOption, DepartmentOption, UserOption } from '@/types'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const formSchema = z.object({
  businessUnitId: z.string().uuid('Выберите подразделение'),
  companyId: z.string().uuid('Выберите компанию'),
  isTarget: z.boolean(),
  isLost: z.boolean(),
  lostReasons: z.string(),
  managerUserIds: z.array(z.string()),
})

type ClientFormItem = SelectCompanyAccount & {
  managers?: Array<{ user: UserOption }>
  owner?: UserOption | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ClientForm = ({
  item,
  initialCompanyId,
  onSuccess,
}: {
  item?: ClientFormItem
  initialCompanyId?: string
  onSuccess?: () => void
}) => {
  const initialManagers = React.useMemo(() => {
    if (item?.managers && item.managers.length > 0) {
      return item.managers.map(({ user }) => user)
    }

    return item?.owner ? [item.owner] : []
  }, [item])

  const [users, setUsers] = React.useState<UserOption[]>([])
  const [selectedManagers, setSelectedManagers] =
    React.useState<UserOption[]>(initialManagers)
  const [companies, setCompanies] = React.useState<CompanyOption[]>([])
  const [companiesLoading, setCompaniesLoading] = React.useState(false)
  const [departments, setDepartments] = React.useState<DepartmentOption[]>([])
  const [step, setStep] = React.useState(
    item?.companyId || initialCompanyId ? 2 : 1,
  )
  const [selectedCompanyId, setSelectedCompanyId] = React.useState(
    item?.companyId ?? initialCompanyId ?? '',
  )
  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = React.useState(
    item?.businessUnitId ?? '',
  )
  const selectedDepartmentId = useDepartmentStore(
    (state) => state.selectedDepartmentId,
  )
  const globalDepartments = useDepartmentStore((state) => state.departments)
  const selectedDeptType = globalDepartments.find(
    (d) => d.id === selectedDepartmentId,
  )?.departmentType
  // Only pre-select/lock when the active department is itself a sales unit.
  // Administrative (and production) selections let the user pick freely.
  const scopedDepartmentId = item
    ? null
    : selectedDeptType === 'sales'
      ? selectedDepartmentId
      : null

  const lockedCompanyId = initialCompanyId
  const isCompanyLocked = !!lockedCompanyId
  const isDepartmentLocked = !!scopedDepartmentId
  const portalRef = React.useRef<HTMLDivElement>(null)

  const departmentsForSelect = React.useMemo(() => {
    if (
      !scopedDepartmentId ||
      departments.some((department) => department.id === scopedDepartmentId)
    ) {
      return departments
    }

    const scopedDepartment = globalDepartments.find(
      (department) => department.id === scopedDepartmentId,
    )

    return scopedDepartment ? [scopedDepartment, ...departments] : departments
  }, [departments, globalDepartments, scopedDepartmentId])

  const form = useForm({
    defaultValues: {
      companyId: item?.companyId ?? initialCompanyId ?? '',
      businessUnitId: item?.businessUnitId ?? scopedDepartmentId ?? '',
      isTarget: item?.isTarget ?? false,
      isLost: item?.isLost ?? false,
      lostReasons: item?.lostReasons ?? '',
      managerUserIds: initialManagers.map((manager) => manager.id),
    },
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      if (!item) {
        try {
          await addAccount({
            data: {
              companyId: value.companyId,
              businessUnitId: value.businessUnitId,
              isTarget: value.isTarget,
              isLost: value.isLost,
              lostReasons: value.lostReasons,
              managerUserIds: value.managerUserIds,
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
              managerUserIds: value.managerUserIds,
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

  const selectCompany = React.useCallback(
    (company: CompanyOption) => {
      setCompanies((current) => {
        if (current.some((item) => item.id === company.id)) return current
        return [company, ...current]
      })

      form.setFieldValue('companyId', company.id)
      if (company.id !== selectedCompanyId) {
        const nextBusinessUnitId = scopedDepartmentId ?? ''

        form.setFieldValue('businessUnitId', nextBusinessUnitId)
        form.setFieldValue('managerUserIds', [])
        setSelectedManagers([])
        setSelectedBusinessUnitId(nextBusinessUnitId)
        if (nextBusinessUnitId !== selectedBusinessUnitId) {
          setUsers([])
        }
        setDepartments([])
      }
      setSelectedCompanyId(company.id)
      setStep(2)
    },
    [form, scopedDepartmentId, selectedBusinessUnitId, selectedCompanyId],
  )

  React.useEffect(() => {
    if (!scopedDepartmentId) return

    form.setFieldValue('businessUnitId', scopedDepartmentId)
    setSelectedBusinessUnitId(scopedDepartmentId)
  }, [form, scopedDepartmentId])

  React.useEffect(() => {
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
    getClientCandidateCompanies({
      data: {
        excludeAccountId: item?.id,
        businessUnitId: scopedDepartmentId ?? undefined,
      },
    })
      .then((items) => {
        setCompanies(items)
        const initial = items.find(
          (company) => company.id === selectedCompanyId,
        )
        if (initial) setStep(2)
      })
      .catch(console.error)
      .finally(() => setCompaniesLoading(false))
  }, [lockedCompanyId, item?.id, scopedDepartmentId])

  React.useEffect(() => {
    if (!selectedCompanyId) {
      setDepartments([])
      return
    }

    getFilteredDepartments({
      data: {
        companyId: selectedCompanyId,
        excludeAccountId: item?.id,
        // Opened from the company/wishlist page (company pre-selected): allow
        // converting the company's wishlist departments into clients. The
        // generic search keeps them hidden.
        includeWishlistDepartments: !!lockedCompanyId,
      },
    })
      .then((items) => {
        setDepartments(items)

        if (
          scopedDepartmentId &&
          items.some((department) => department.id === scopedDepartmentId)
        ) {
          form.setFieldValue('businessUnitId', scopedDepartmentId)
          setSelectedBusinessUnitId(scopedDepartmentId)
        }
      })
      .catch(console.error)
  }, [selectedCompanyId, item?.id, scopedDepartmentId, form, lockedCompanyId])

  React.useEffect(() => {
    if (!selectedBusinessUnitId || !selectedCompanyId) {
      setUsers([])
      return
    }

    getFilteredUsers({ data: { businessUnitId: selectedBusinessUnitId } })
      .then(setUsers)
      .catch(console.error)
  }, [selectedBusinessUnitId, selectedCompanyId])

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
        id="client-form"
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
                name="businessUnitId"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Подразделение
                      </FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(val) => {
                          field.handleChange(val)
                          setSelectedBusinessUnitId(val)
                          form.setFieldValue('managerUserIds', [])
                          setSelectedManagers([])
                        }}
                        disabled={!selectedCompanyId || isDepartmentLocked}
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
                          {departmentsForSelect.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
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

              <form.Field
                name="managerUserIds"
                children={() => (
                  <Field>
                    <FieldLabel>Менеджеры</FieldLabel>
                    <Combobox
                      items={users}
                      itemToStringValue={(user) => user.name}
                      isItemEqualToValue={(a, b) => a.id === b.id}
                      multiple
                      value={selectedManagers}
                      onValueChange={setSelectedManagers}
                      disabled={!selectedBusinessUnitId}
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
                            !selectedBusinessUnitId
                              ? 'Сначала выберите подразделение'
                              : 'Добавить менеджера'
                          }
                        />
                      </ComboboxChips>
                      <ComboboxContent container={portalRef.current}>
                        <ComboboxEmpty>Менеджеры не найдены</ComboboxEmpty>
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
            </>
          )}
        </div>

        {step === 2 && (
          <div className="flex shrink-0 justify-end border-t pt-4">
            <Button type="submit">{item ? 'Изменить' : 'Создать'}</Button>
          </div>
        )}
      </form>
    </TooltipProvider>
  )
}

export default ClientForm
