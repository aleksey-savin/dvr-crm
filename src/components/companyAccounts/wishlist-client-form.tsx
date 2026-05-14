import * as React from 'react'
import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'

import {
  addWishlistClient,
  getCompanyById,
  getFilteredWishlistCompanies,
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
import type { SelectCompanyAccount } from '@/db/types'
import type { CompanyOption, DepartmentOption } from '@/types'

const formSchema = z.object({
  companyId: z.string().min(1, 'Выберите компанию'),
  businessUnitId: z.string().min(1, 'Выберите подразделение'),
  why: z.union([z.string(), z.undefined()]),
})

const WishlistClientForm = ({
  initialCompanyId,
  item,
  onSuccess,
}: {
  initialCompanyId?: string
  item?: Pick<
    SelectCompanyAccount,
    'id' | 'companyId' | 'businessUnitId' | 'why'
  >
  onSuccess?: () => void
}) => {
  const [departments, setDepartments] = React.useState<DepartmentOption[]>([])
  const [companies, setCompanies] = React.useState<CompanyOption[]>([])
  const [companiesLoading, setCompaniesLoading] = React.useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = React.useState(
    item?.companyId ?? initialCompanyId ?? '',
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
  const isDepartmentLocked = !!scopedDepartmentId

  React.useEffect(() => {
    fetchDepartmentOptions().then(setDepartments).catch(console.error)

    if (lockedCompanyId) {
      getCompanyById({ data: { id: lockedCompanyId } })
        .then((company) => {
          if (!company) return
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
      businessUnitId: item?.businessUnitId ?? scopedDepartmentId ?? '',
      why: item?.why ?? undefined,
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
              businessUnitId: value.businessUnitId,
              why: value.why,
            },
          })
          toast.success('Компания добавлена в вишлист')
        } else {
          await updateWishlistClient({
            data: {
              id: item.id,
              businessUnitId: value.businessUnitId,
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

  const selectCompany = React.useCallback(
    (company: CompanyOption) => {
      setCompanies((current) => {
        if (current.some((item) => item.id === company.id)) return current
        return [company, ...current]
      })
      form.setFieldValue('companyId', company.id)
      if (!item && scopedDepartmentId) {
        form.setFieldValue('businessUnitId', scopedDepartmentId)
      }
      setSelectedCompanyId(company.id)
      setStep(2)
    },
    [form, item, scopedDepartmentId],
  )

  React.useEffect(() => {
    if (!scopedDepartmentId) return

    form.setFieldValue('businessUnitId', scopedDepartmentId)
  }, [form, scopedDepartmentId])

  return (
    <TooltipProvider>
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
                name="businessUnitId"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Подразделение *
                      </FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value)}
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
                          {departments.map((department) => (
                            <SelectItem
                              key={department.id}
                              value={department.id}
                            >
                              {department.name}
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
