import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  CheckCircle2Icon,
  CircleDashedIcon,
  ClockIcon,
  CalendarIcon,
  PlusIcon,
  ListTodoIcon,
  ExternalLinkIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import TodoForm from '@/components/todos/todo-form'
import type { AccountTodoItem, TodoStatus } from '@/types'

type Props = {
  todos: AccountTodoItem[]
  clientId: string
  defaultDepartmentId: string
  onRefresh: () => void
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const statusConfig: Record<
  TodoStatus,
  {
    label: string
    variant: 'warning' | 'default' | 'success'
    icon: React.ElementType
  }
> = {
  'not started': {
    label: 'Не в работе',
    variant: 'warning',
    icon: CircleDashedIcon,
  },
  'in progress': { label: 'В работе', variant: 'default', icon: ClockIcon },
  completed: { label: 'Выполнена', variant: 'success', icon: CheckCircle2Icon },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const isOverdue = (deadline: Date | string, status: TodoStatus) => {
  if (status === 'completed') return false
  return new Date(deadline) < new Date()
}

// ---------------------------------------------------------------------------
// Add todo dialog
// ---------------------------------------------------------------------------

function AddTodoDialog({
  clientId,
  defaultDepartmentId,
  onSuccess,
}: {
  clientId: string
  defaultDepartmentId: string
  onSuccess: () => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
          <PlusIcon className="size-3.5" />
          Новая задача
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Новая задача</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <TodoForm
            clientId={clientId}
            defaultDepartmentId={defaultDepartmentId}
            onSuccess={() => {
              setOpen(false)
              onSuccess()
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Single todo row
// ---------------------------------------------------------------------------

function TodoRow({ todo }: { todo: AccountTodoItem }) {
  const cfg = statusConfig[todo.status]
  const StatusIcon = cfg.icon
  const overdue = isOverdue(todo.deadline, todo.status)

  return (
    <div className="flex items-start gap-3 py-2.5 group">
      <StatusIcon className="size-4 mt-0.5 shrink-0 text-muted-foreground" />

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium leading-snug truncate">
            {todo.name}
          </span>
          <Badge
            variant={cfg.variant}
            className="h-4 px-1.5 text-[10px] shrink-0"
          >
            {cfg.label}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span
            className={`flex items-center gap-1 ${overdue ? 'text-destructive font-medium' : ''}`}
          >
            <CalendarIcon className="size-3" />
            {fmtDate(todo.deadline)}
            {overdue && ' (просрочена)'}
          </span>

          {todo.responsibleUsers.length > 0 && (
            <span>
              {todo.responsibleUsers.map((r) => r.user.name).join(', ')}
            </span>
          )}
        </div>
      </div>

      <Button
        asChild
        variant="ghost"
        size="icon-sm"
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground"
      >
        <Link to="/todos/$id/view" params={{ id: todo.id }}>
          <ExternalLinkIcon className="size-3.5" />
        </Link>
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function ClientTodosSection({
  todos,
  clientId,
  defaultDepartmentId,
  onRefresh,
}: Props) {
  // Filter out archived, split active vs completed
  const active = todos.filter((t) => !t.archivedAt && t.status !== 'completed')
  const completed = todos.filter(
    (t) => !t.archivedAt && t.status === 'completed',
  )
  const [showCompleted, setShowCompleted] = React.useState(false)

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ListTodoIcon className="size-4 text-muted-foreground" />
          Задачи
          {active.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {active.length}
            </Badge>
          )}
        </div>
        <AddTodoDialog
          clientId={clientId}
          defaultDepartmentId={defaultDepartmentId}
          onSuccess={onRefresh}
        />
      </div>

      {/* Active todos */}
      {active.length === 0 && completed.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-1">Задач нет</p>
      ) : (
        <div className="flex flex-col divide-y">
          {active.map((t) => (
            <TodoRow key={t.id} todo={t} />
          ))}

          {/* Completed toggle */}
          {completed.length > 0 && (
            <>
              {active.length > 0 && <Separator className="my-1" />}
              <button
                type="button"
                onClick={() => setShowCompleted((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-2 text-left w-fit"
              >
                <CheckCircle2Icon className="size-3.5" />
                {showCompleted
                  ? 'Скрыть выполненные'
                  : `Показать выполненные (${completed.length})`}
              </button>

              {showCompleted && (
                <div className="flex flex-col divide-y opacity-60">
                  {completed.map((t) => (
                    <TodoRow key={t.id} todo={t} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
