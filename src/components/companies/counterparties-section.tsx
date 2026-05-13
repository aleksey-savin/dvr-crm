import * as React from 'react'
import { toast } from 'sonner'
import { HandshakeIcon, PlusIcon, Settings2Icon, XIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  addCompanyCounterparty,
  removeCompanyCounterparty,
  updateCounterparty,
} from '@/components/companies/actions'
import type { Counterparty } from '@/types'

type Props = {
  counterparties: Counterparty[]
  companyId: string
  onRefresh: () => void
}

type CounterpartyFormState = {
  name: string
  fullName: string
  tin: string
}

const emptyForm = (): CounterpartyFormState => ({
  name: '',
  fullName: '',
  tin: '',
})

function CounterpartyFormDialog({
  companyId,
  existing,
  onSaved,
  children,
}: {
  companyId: string
  existing?: Counterparty
  onSaved: () => void
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState<CounterpartyFormState>(emptyForm)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setForm(
      existing
        ? {
            name: existing.name,
            fullName: existing.fullName ?? '',
            tin: existing.tin ?? '',
          }
        : emptyForm(),
    )
  }, [open, existing])

  const set =
    (key: keyof CounterpartyFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const name = form.name.trim()
    if (name.length < 2) return

    const data = {
      name,
      fullName: form.fullName.trim() || undefined,
      tin: form.tin.trim() || undefined,
    }

    setLoading(true)
    try {
      if (existing) {
        await updateCounterparty({ data: { id: existing.id, ...data } })
        toast.success('Контрагент обновлён')
      } else {
        await addCompanyCounterparty({ data: { companyId, ...data } })
        toast.success('Контрагент добавлен')
      }
      onSaved()
      setOpen(false)
    } catch {
      toast.error('Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {existing ? 'Редактировать контрагента' : 'Добавить контрагента'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Название *</Label>
            <Input
              value={form.name}
              onChange={set('name')}
              placeholder="Название контрагента"
              autoFocus
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Полное наименование</Label>
            <Input
              value={form.fullName}
              onChange={set('fullName')}
              placeholder="Полное юридическое наименование"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>ИНН</Label>
            <Input
              value={form.tin}
              onChange={set('tin')}
              placeholder="ИНН"
              inputMode="numeric"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={loading || form.name.trim().length < 2}
            >
              {existing ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CounterpartiesSection({
  counterparties,
  companyId,
  onRefresh,
}: Props) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const handleDelete = async (counterpartyId: string) => {
    setDeletingId(counterpartyId)
    try {
      await removeCompanyCounterparty({ data: { companyId, counterpartyId } })
      toast.success('Контрагент удалён')
      onRefresh()
    } catch {
      toast.error('Не удалось удалить')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <HandshakeIcon className="size-4 text-muted-foreground" />
        Контрагенты
        {counterparties.length > 0 && (
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            {counterparties.length}
          </Badge>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[28%] font-semibold">Название</TableHead>
              <TableHead className="font-semibold">
                Полное наименование
              </TableHead>
              <TableHead className="w-[18%] font-semibold">ИНН</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {counterparties.map((counterparty) => (
              <TableRow key={counterparty.id}>
                <TableCell className="font-medium">
                  {counterparty.name}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {counterparty.fullName ?? '—'}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {counterparty.tin ?? '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <CounterpartyFormDialog
                      companyId={companyId}
                      existing={counterparty}
                      onSaved={onRefresh}
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                      >
                        <Settings2Icon className="size-3.5" />
                      </Button>
                    </CounterpartyFormDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={deletingId === counterparty.id}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <XIcon className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Удалить контрагента?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Контрагент «{counterparty.name}» будет отвязан от
                            компании. Если он больше нигде не используется, он
                            будет удалён.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            disabled={deletingId === counterparty.id}
                          >
                            Отмена
                          </AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            disabled={deletingId === counterparty.id}
                            onClick={() => handleDelete(counterparty.id)}
                          >
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={4}>
                <CounterpartyFormDialog
                  companyId={companyId}
                  onSaved={onRefresh}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-1.5 text-muted-foreground"
                  >
                    <PlusIcon className="size-3.5" />
                    Добавить контрагента
                  </Button>
                </CounterpartyFormDialog>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
