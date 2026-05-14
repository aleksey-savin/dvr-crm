import * as React from 'react'
import { toast } from 'sonner'
import { Building2Icon, CheckIcon, PlusIcon, SearchIcon } from 'lucide-react'

import { addCompany } from '@/components/companies/actions'
import { fetchIndustries } from '@/components/industries/actions'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CompanyOption } from '@/types'

type Props = {
  companies: CompanyOption[]
  loading?: boolean
  selectedCompanyId: string
  locked?: boolean
  onSelect: (company: CompanyOption) => void
}

type CreateCompanyState = {
  name: string
  industryId?: string
  regionalMarketPosition: string
}

type IndustryOption = {
  id: string
  name: string
}

const NO_INDUSTRY_VALUE = '__no_industry__'

export function CompanySelectStep({
  companies,
  loading = false,
  selectedCompanyId,
  locked = false,
  onSelect,
}: Props) {
  const [query, setQuery] = React.useState('')
  const [mode, setMode] = React.useState<'select' | 'create'>('select')
  const [changingSelection, setChangingSelection] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [industries, setIndustries] = React.useState<IndustryOption[]>([])
  const [industriesLoading, setIndustriesLoading] = React.useState(false)
  const [createCompany, setCreateCompany] = React.useState<CreateCompanyState>({
    name: '',
    regionalMarketPosition: '',
  })

  React.useEffect(() => {
    if (mode !== 'create') return

    let cancelled = false
    setIndustriesLoading(true)
    fetchIndustries()
      .then((rows) => {
        if (!cancelled) setIndustries(rows)
      })
      .catch(() => {
        if (!cancelled) toast.error('Не удалось загрузить отрасли')
      })
      .finally(() => {
        if (!cancelled) setIndustriesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [mode])

  const selectedCompany = companies.find(
    (company) => company.id === selectedCompanyId,
  )
  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const nameInvalid =
    createCompany.name.trim().length > 0 && createCompany.name.trim().length < 2

  const handleCreate = async () => {
    const name = createCompany.name.trim()
    if (name.length < 2) {
      toast.error('Название компании должно содержать минимум 2 символа')
      return
    }

    setCreating(true)
    try {
      const id = await addCompany({
        data: {
          name,
          industryId: createCompany.industryId,
          regionalMarketPosition:
            createCompany.regionalMarketPosition.trim() || undefined,
        },
      })
      const company = { id, name }
      onSelect(company)
      setChangingSelection(false)
      setMode('select')
      setQuery('')
      setCreateCompany({
        name: '',
        industryId: undefined,
        regionalMarketPosition: '',
      })
      toast.success('Компания создана')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
    } finally {
      setCreating(false)
    }
  }

  if (locked && selectedCompany) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Building2Icon className="size-4 text-muted-foreground" />
          Компания
        </div>
        <div className="rounded-md border px-3 py-2">
          <span className="block truncate text-sm font-medium">
            {selectedCompany.name}
          </span>
        </div>
      </div>
    )
  }

  if (locked) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Building2Icon className="size-4 text-muted-foreground" />
          Компания
        </div>
        <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
          Загрузка...
        </div>
      </div>
    )
  }

  if (selectedCompany && !changingSelection) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Building2Icon className="size-4 text-muted-foreground" />
          Компания
        </div>
        <div className="flex items-center gap-3 rounded-md border px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {selectedCompany.name}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setChangingSelection(true)
              setMode('select')
            }}
          >
            Изменить
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Building2Icon className="size-4 text-muted-foreground" />
          Компания
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={mode === 'select' ? 'secondary' : 'ghost'}
            onClick={() => setMode('select')}
          >
            Выбрать
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'create' ? 'secondary' : 'ghost'}
            className="gap-1.5"
            onClick={() => setMode('create')}
          >
            <PlusIcon className="size-3.5" />
            Создать
          </Button>
        </div>
      </div>

      {mode === 'select' ? (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти компанию"
              className="pl-9"
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-md border">
            {loading ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Загрузка...
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Компания не найдена
              </div>
            ) : (
              filteredCompanies.map((company) => {
                const selected = company.id === selectedCompanyId

                return (
                  <button
                    key={company.id}
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      onSelect(company)
                      setChangingSelection(false)
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {company.name}
                    </span>
                    {selected && <CheckIcon className="size-4 text-primary" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-md border p-3">
          <Field data-invalid={nameInvalid}>
            <FieldLabel htmlFor="new-company-name">Наименование *</FieldLabel>
            <Input
              id="new-company-name"
              value={createCompany.name}
              onChange={(event) =>
                setCreateCompany((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Название компании"
              aria-invalid={nameInvalid}
              autoComplete="off"
            />
            {nameInvalid && (
              <FieldError
                errors={[
                  { message: 'Название должно содержать минимум 2 символа' },
                ]}
              />
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="new-company-industry">Отрасль</FieldLabel>
            <Select
              value={createCompany.industryId ?? NO_INDUSTRY_VALUE}
              onValueChange={(value) =>
                setCreateCompany((current) => ({
                  ...current,
                  industryId: value === NO_INDUSTRY_VALUE ? undefined : value,
                }))
              }
              disabled={industriesLoading}
            >
              <SelectTrigger id="new-company-industry" className="w-full">
                <SelectValue
                  placeholder={
                    industriesLoading ? 'Загрузка...' : 'Выберите отрасль'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_INDUSTRY_VALUE}>Не указана</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry.id} value={industry.id}>
                    {industry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="new-company-market-position">
              Позиция на региональном рынке
            </FieldLabel>
            <Input
              id="new-company-market-position"
              value={createCompany.regionalMarketPosition}
              onChange={(event) =>
                setCreateCompany((current) => ({
                  ...current,
                  regionalMarketPosition: event.target.value,
                }))
              }
              placeholder="Позиция компании на региональном рынке"
              autoComplete="off"
            />
          </Field>

          <Separator />

          <div className="flex justify-end">
            <Button
              type="button"
              className="gap-2"
              disabled={creating || createCompany.name.trim().length < 2}
              onClick={handleCreate}
            >
              <PlusIcon className="size-4" />
              {creating ? 'Создание...' : 'Создать и выбрать'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
