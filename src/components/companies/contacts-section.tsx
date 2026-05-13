import * as React from 'react'
import { toast } from 'sonner'
import {
  MailIcon,
  PhoneIcon,
  PlusIcon,
  SendIcon,
  Settings2Icon,
  UsersRoundIcon,
  XIcon,
} from 'lucide-react'

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
import { Textarea } from '@/components/ui/textarea'
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

type ContactFormState = {
  name: string
  position: string
  description: string
  phone: string
  email: string
  telegram: string
  max: string
}

const emptyForm = (): ContactFormState => ({
  name: '',
  position: '',
  description: '',
  phone: '',
  email: '',
  telegram: '',
  max: '',
})

function cleanMessengerValue(value: string) {
  return value.trim().replace(/^@/, '')
}

function telegramHref(value: string) {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://t.me/${cleanMessengerValue(trimmed)}`
}

function maxHref(value: string) {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://max.ru/${cleanMessengerValue(trimmed)}`
}

function MaxIcon({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className ?? ''}`}
    >
      <img
        src="/max_logo.svg"
        alt=""
        className="size-full invert dark:invert-0"
      />
    </span>
  )
}

function ContactLink({
  href,
  icon: Icon,
  children,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      className="inline-flex min-w-0 items-center gap-1.5 text-sm text-primary hover:underline"
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </a>
  )
}

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
    if (!open) return
    setForm(
      existing
        ? {
            name: existing.name,
            position: existing.position ?? '',
            description: existing.description ?? '',
            phone: existing.phone ?? '',
            email: existing.email ?? '',
            telegram: existing.telegram ?? '',
            max: existing.max ?? '',
          }
        : emptyForm(),
    )
  }, [open, existing])

  const set =
    (key: keyof ContactFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) return

    const data = {
      name: form.name.trim(),
      position: form.position.trim() || undefined,
      description: form.description.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      telegram: form.telegram.trim() || undefined,
      max: form.max.trim() || undefined,
    }

    setLoading(true)
    try {
      if (existing) {
        await updateCompanyContact({ data: { id: existing.id, ...data } })
        toast.success('Контакт обновлён')
      } else {
        await addCompanyContact({ data: { companyId, ...data } })
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {existing ? 'Редактировать контакт' : 'Добавить контакт'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Имя *</Label>
              <Input
                value={form.name}
                onChange={set('name')}
                placeholder="Иванов Иван"
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
              <Label>Телефон</Label>
              <Input
                value={form.phone}
                onChange={set('phone')}
                placeholder="+7 999 123-45-67"
                inputMode="tel"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={set('email')}
                placeholder="ivan@example.com"
                type="email"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Telegram</Label>
              <Input
                value={form.telegram}
                onChange={set('telegram')}
                placeholder="@ivan"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Max</Label>
              <Input
                value={form.max}
                onChange={set('max')}
                placeholder="@ivan"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Описание</Label>
            <Textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Краткое описание"
              className="min-h-16 resize-none"
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

export function ContactsSection({ contacts, companyId, onRefresh }: Props) {
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <UsersRoundIcon className="size-4 text-muted-foreground" />
        Контакты
        {contacts.length > 0 && (
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            {contacts.length}
          </Badge>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[26%] font-semibold">Имя</TableHead>
              <TableHead className="font-semibold">Контакты</TableHead>
              <TableHead className="w-[30%] font-semibold">Описание</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => {
              const position = contact.position?.trim()
              const description = contact.description?.trim()
              const phone = contact.phone?.trim()
              const email = contact.email?.trim()
              const telegram = contact.telegram?.trim()
              const max = contact.max?.trim()

              return (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-medium">{contact.name}</span>
                      {position && (
                        <span className="text-xs text-muted-foreground">
                          {position}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-1">
                      {phone && (
                        <ContactLink href={`tel:${phone}`} icon={PhoneIcon}>
                          {phone}
                        </ContactLink>
                      )}
                      {email && (
                        <ContactLink href={`mailto:${email}`} icon={MailIcon}>
                          {email}
                        </ContactLink>
                      )}
                      {telegram && (
                        <ContactLink
                          href={telegramHref(telegram)}
                          icon={SendIcon}
                        >
                          {telegram}
                        </ContactLink>
                      )}
                      {max && (
                        <ContactLink href={maxHref(max)} icon={MaxIcon}>
                          {max}
                        </ContactLink>
                      )}
                      {!phone && !email && !telegram && !max && '—'}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal text-sm text-muted-foreground">
                    {description || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <ContactFormDialog
                        companyId={companyId}
                        existing={contact}
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={deletingId === contact.id}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <XIcon className="size-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Удалить контакт?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Контакт «{contact.name}» будет удалён из компании.
                              Это действие нельзя отменить.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              disabled={deletingId === contact.id}
                            >
                              Отмена
                            </AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              disabled={deletingId === contact.id}
                              onClick={() => handleDelete(contact.id)}
                            >
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            <TableRow>
              <TableCell colSpan={4}>
                <ContactFormDialog companyId={companyId} onSaved={onRefresh}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-1.5 text-muted-foreground"
                  >
                    <PlusIcon className="size-3.5" />
                    Добавить контакт
                  </Button>
                </ContactFormDialog>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
