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
import { fetchDepartmentOptions } from '@/components/departments/actions'
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

  const lockedCompanyId = initialCompanyId ?? item?.companyId
  const isCompanyLocked = !!lockedCompanyId

  React.useEffect(() => {
    fetchDepartmentOptions().then(setDepartments).catch(console.error)

    if (lockedCompanyId) {
      getCompanyById({ data: { id: lockedCompanyId } })
        .then((company) => setCompanies([company]))
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
      businessUnitId: item?.businessUnitId ?? '',
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

  return (
    <TooltipProvider>
      <form
        id="wishlist-client-form"
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <form.Field
          name="businessUnitId"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Подразделение *</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
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
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
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
                <FieldLabel htmlFor={field.name}>Компания *</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                  disabled={isCompanyLocked || companiesLoading}
                >
                  <SelectTrigger
                    id={field.name}
                    aria-invalid={isInvalid}
                    className="w-full"
                    onBlur={field.handleBlur}
                  >
                    <SelectValue
                      placeholder={
                        isCompanyLocked
                          ? (companies[0]?.name ?? 'Загрузка...')
                          : companiesLoading
                            ? 'Загрузка...'
                            : 'Выберите компанию'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
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
