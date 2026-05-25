import * as React from 'react'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type KanbanAddColumnProps = {
  onAdd: (name: string) => Promise<void> | void
  label?: string
}

export function KanbanAddColumn({
  onAdd,
  label = 'Создать колонку',
}: KanbanAddColumnProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [name, setName] = React.useState('')
  const [isSaving, setIsSaving] = React.useState(false)

  const reset = () => {
    setName('')
    setIsEditing(false)
  }

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      reset()
      return
    }
    setIsSaving(true)
    try {
      await onAdd(trimmed)
      reset()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось создать колонку',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex w-72 shrink-0 flex-col self-start rounded-xl border border-dashed bg-muted/20">
      {isEditing ? (
        <div className="flex flex-col gap-2 p-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => void save()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void save()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                reset()
              }
            }}
            placeholder="Название колонки"
            disabled={isSaving}
            autoFocus
            className="h-8 text-sm"
          />
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="m-2 justify-start text-muted-foreground hover:text-foreground"
          onClick={() => setIsEditing(true)}
        >
          <PlusIcon className="mr-1 size-3.5" />
          {label}
        </Button>
      )}
    </div>
  )
}
