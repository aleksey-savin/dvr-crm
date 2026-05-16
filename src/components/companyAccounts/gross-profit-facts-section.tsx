import * as React from 'react'
import { toast } from 'sonner'
import { LandmarkIcon, PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { addGrossProfitFact } from '@/components/companyAccounts/actions'
import { DeleteRowButton, Section } from './client-view/shared'

type GrossProfitFact = {
  id: string
  amount: string
  factDate: string
  description: string | null
  source: 'manual' | 'one_c'
  manager?: { id: string; name: string } | null
  department?: { id: string; name: string } | null
  managerName?: string
  departmentName?: string
}

type AccountOption = {
  id: string
  name: string
}

type ManagerOption = {
  id: string
  name: string
  departmentName?: string | null
}

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
})

function formatMoney(value: string) {
  return currency.format(Number(value))
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('ru-RU')
}

function factManagerName(fact: GrossProfitFact) {
  return fact.manager?.name ?? fact.managerName ?? 'Не найден'
}

function factDepartmentName(fact: GrossProfitFact) {
  return fact.department?.name ?? fact.departmentName ?? 'Не найдено'
}

export function GrossProfitFactDialog({
  accountId,
  accounts,
  managers,
  onRefresh,
  children,
}: {
  accountId?: string
  accounts?: AccountOption[]
  managers: ManagerOption[]
  onRefresh: () => void | Promise<void>
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [selectedAccountId, setSelectedAccountId] = React.useState(
    accountId ?? '',
  )
  const [managerUserId, setManagerUserId] = React.useState('')
  const [amount, setAmount] = React.useState('')
  const [factDate, setFactDate] = React.useState(
    new Date().toISOString().split('T')[0],
  )
  const [description, setDescription] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const effectiveAccountId = accountId ?? selectedAccountId
  const canSubmit =
    effectiveAccountId &&
    managerUserId &&
    amount.trim() &&
    factDate &&
    managers.length > 0

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    try {
      await addGrossProfitFact({
        data: {
          clientId: effectiveAccountId,
          managerUserId,
          amount: amount.trim(),
          factDate,
          description,
        },
      })
      toast.success('Факт ВП добавлен')
      setAmount('')
      setDescription('')
      setOpen(false)
      await onRefresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось добавить',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить факт ВП</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!accountId && (
            <div className="flex flex-col gap-1.5">
              <Label>Клиент</Label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите клиента" />
                </SelectTrigger>
                <SelectContent>
                  {(accounts ?? []).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Дата факта</Label>
              <Input
                type="date"
                value={factDate}
                onChange={(event) => setFactDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Валовая прибыль</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Менеджер</Label>
            <Select value={managerUserId} onValueChange={setManagerUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите менеджера" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.departmentName
                      ? `${manager.name} · ${manager.departmentName}`
                      : manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Описание</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Необязательно"
              className="min-h-24 resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              Добавить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function GrossProfitFactsSection({
  facts,
  clientId,
  managers,
  onDelete,
  onRefresh,
}: {
  facts: GrossProfitFact[]
  clientId: string
  managers: ManagerOption[]
  onDelete: (id: string) => Promise<void>
  onRefresh: () => void | Promise<void>
}) {
  const total = facts.reduce((sum, fact) => sum + Number(fact.amount), 0)

  return (
    <Section
      icon={LandmarkIcon}
      title="Факт валовой прибыли"
      action={
        <GrossProfitFactDialog
          accountId={clientId}
          managers={managers}
          onRefresh={onRefresh}
        >
          <Button size="sm" variant="outline" className="gap-1.5">
            <PlusIcon className="size-3.5" />
            Добавить
          </Button>
        </GrossProfitFactDialog>
      }
    >
      {facts.length === 0 ? (
        <p className="py-2 text-sm italic text-muted-foreground">Данных нет</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Менеджер</TableHead>
              <TableHead>Подразделение</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {facts.map((fact) => (
              <TableRow key={fact.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDate(fact.factDate)}
                </TableCell>
                <TableCell className="font-medium">
                  {formatMoney(fact.amount)}
                </TableCell>
                <TableCell>{factManagerName(fact)}</TableCell>
                <TableCell>{factDepartmentName(fact)}</TableCell>
                <TableCell className="max-w-72 truncate text-muted-foreground">
                  {fact.description || '—'}
                </TableCell>
                <TableCell>
                  {fact.source === 'manual' && (
                    <DeleteRowButton onDelete={() => onDelete(fact.id)} />
                  )}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-semibold">Итого</TableCell>
              <TableCell className="font-semibold">
                {currency.format(total)}
              </TableCell>
              <TableCell colSpan={4} />
            </TableRow>
          </TableBody>
        </Table>
      )}
    </Section>
  )
}

export default GrossProfitFactsSection
