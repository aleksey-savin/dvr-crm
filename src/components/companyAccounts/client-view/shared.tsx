import * as React from 'react'
import { toast } from 'sonner'
import { XIcon } from 'lucide-react'

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
import { Textarea } from '@/components/ui/textarea'

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

export function Section({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: React.ElementType
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline delete button
// ---------------------------------------------------------------------------

export function DeleteRowButton({
  onDelete,
}: {
  onDelete: () => Promise<void>
}) {
  const [loading, setLoading] = React.useState(false)

  const handle = async () => {
    setLoading(true)
    try {
      await onDelete()
    } catch {
      toast.error('Не удалось удалить')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={loading}
      onClick={handle}
      className="text-muted-foreground hover:text-destructive"
    >
      <XIcon className="size-3.5" />
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Text-entry dialog (risks / upselling)
// ---------------------------------------------------------------------------

export function TextEntryDialog({
  title,
  label,
  onAdd,
  children,
}: {
  title: string
  label: string
  onAdd: (value: string) => Promise<void>
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    setLoading(true)
    try {
      await onAdd(value.trim())
      setValue('')
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{label}</Label>
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Введите описание…"
              className="min-h-24 resize-none"
              autoFocus
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
            <Button type="submit" disabled={loading || !value.trim()}>
              Добавить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Year + value dialog (gross profit / target forecast)
// ---------------------------------------------------------------------------

export function YearValueDialog({
  title,
  onAdd,
  children,
}: {
  title: string
  onAdd: (year: number, value: string) => Promise<void>
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [year, setYear] = React.useState(new Date().getFullYear())
  const [value, setValue] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    setLoading(true)
    try {
      await onAdd(year, value.trim())
      setValue('')
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Год</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={2000}
                max={2100}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Значение</Label>
              <Input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !value.trim()}>
              Добавить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
