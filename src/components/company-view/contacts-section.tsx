import * as React from 'react'
import { toast } from 'sonner'
import { UsersRoundIcon, PlusIcon, Settings2Icon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { Section } from '@/components/client-view/shared'
import {
  addCompanyContact,
  deleteCompanyContact,
  updateCompanyContact,
} from '@/components/companies/actions'
import type { Contact } from '@/types'

type Props = {
  contacts: Contact[]
  companyId: string
  onRefresh: () => void
}

// ---------------------------------------------------------------------------
// Contact form state
// ---------------------------------------------------------------------------

type ContactFormState = {
  name: string
  position: string
  description: string
  contacts: string
}

const emptyForm = (): ContactFormState => ({
  name: '',
  position: '',
  description: '',
  contacts: '',
})

// ---------------------------------------------------------------------------
// Add / Edit dialog
// ---------------------------------------------------------------------------

function ContactFormDialog({
  companyId,
  existing,
  onSaved,
  children,
}: {
  companyId: string
  existing?: Contact
  onSaved: () => void
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState<ContactFormState>(emptyForm)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setForm(
        existing
          ? {
              name: existing.name,
              position: existing.position ?? '',
              description: existing.description ?? '',
              contacts: existing.contacts ?? '',
            }
          : emptyForm(),
      )
    }
  }, [open, existing])

  const set =
    (key: keyof ContactFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      if (existing) {
        await updateCompanyContact({
          data: {
            id: existing.id,
            name: form.name.trim(),
            position: form.position.trim() || undefined,
            description: form.description.trim() || undefined,
            contacts: form.contacts.trim() || undefined,
          },
        })
        toast.success('Контакт обновлён')
      } else {
        await addCompanyContact({
          data: {
            companyId,
            name: form.name.trim(),
            position: form.position.trim() || undefined,
            description: form.description.trim() || undefined,
            contacts: form.contacts.trim() || undefined,
          },
        })
        toast.success('Контакт добавлен')
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
            {existing ? 'Редактировать контакт' : 'Добавить контакт'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Имя *</Label>
            <Input
              value={form.name}
              onChange={set('name')}
              placeholder="Иванов Иван Иванович"
              autoFocus
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Должность</Label>
            <Input
              value={form.position}
              onChange={set('position')}
              placeholder="Генеральный директор"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Описание</Label>
            <Textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Краткое описание…"
              className="min-h-20 resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Контакты</Label>
            <Textarea
              value={form.contacts}
              onChange={set('contacts')}
              placeholder="+7 (999) 123-45-67&#10;ivan@example.com&#10;@ivan_tg"
              className="min-h-20 resize-none"
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
            <Button type="submit" disabled={loading || !form.name.trim()}>
              {existing ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Manage dialog
// ---------------------------------------------------------------------------

function ManageDialog({ contacts, companyId, onRefresh }: Props) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteCompanyContact({ data: { id } })
      toast.success('Контакт удалён')
      onRefresh()
    } catch {
      toast.error('Не удалось удалить')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Управление контактами</DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto pr-1">
        <Section
          icon={UsersRoundIcon}
          title="Контакты"
          action={
            <ContactFormDialog companyId={companyId} onSaved={onRefresh}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <PlusIcon className="size-3.5" />
                Добавить
              </Button>
            </ContactFormDialog>
          }
        >
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              Контактов не добавлено
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Должность</TableHead>
                  <TableHead>Контакты</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium leading-tight">
                          {c.name}
                        </span>
                        {c.description && (
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {c.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.position ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm whitespace-pre-line text-muted-foreground">
                      {c.contacts ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ContactFormDialog
                          companyId={companyId}
                          existing={c}
                          onSaved={onRefresh}
                        >
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                          >
                            <Settings2Icon className="size-3.5" />
                          </Button>
                        </ContactFormDialog>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={deletingId === c.id}
                          onClick={() => handleDelete(c.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <XIcon className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Section>
      </div>
    </DialogContent>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function ContactsSection({ contacts, companyId, onRefresh }: Props) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <UsersRoundIcon className="size-4 text-muted-foreground" />
          Контакты
          {contacts.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {contacts.length}
            </Badge>
          )}
        </div>

        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Контактов не добавлено
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {contacts.map((c) => (
              <li key={c.id} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium leading-tight">
                    {c.name}
                  </span>
                  {c.position && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 px-1.5"
                    >
                      {c.position}
                    </Badge>
                  )}
                </div>
                {c.contacts && (
                  <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                    {c.contacts}
                  </p>
                )}
                {c.description && (
                  <p className="text-xs text-muted-foreground/70 italic">
                    {c.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Manage button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 self-start shrink-0"
          >
            <Settings2Icon className="size-3.5" />
            Управлять
          </Button>
        </DialogTrigger>
        <ManageDialog
          contacts={contacts}
          companyId={companyId}
          onRefresh={onRefresh}
        />
      </Dialog>
    </div>
  )
}
