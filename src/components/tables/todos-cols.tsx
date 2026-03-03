import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { ArrowUpDown, EditIcon, EyeIcon, Trash2Icon } from 'lucide-react'
import { useDepartmentStore } from '@/stores/department-store'
import { cn } from '@/lib/utils'

export type Todo = {
  id: string
  name: string
  client: { id: string; name: string } | null
  creator: string
  createdAt: Date
  responsibles: string[]
  deadline: Date | null
  status: 'not started' | 'in progress' | 'completed'
  completedAt: Date | null
  departmentId: string | null
  department: string | null
}

const statusOptions: Record<
  Todo['status'],
  { label: string; variant: 'warning' | 'default' | 'success' }
> = {
  'not started': { label: 'не в работе', variant: 'warning' },
  'in progress': { label: 'в работе', variant: 'default' },
  completed: { label: 'выполнена', variant: 'success' },
}

export const columns: ColumnDef<Todo>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Описание
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const todo = row.original
      const selectedDepartmentId = useDepartmentStore(
        (s) => s.selectedDepartmentId,
      )
      return (
        <div className="flex flex-col min-w-48">
          <span
            className={cn(
              'font-medium wrap-break-word whitespace-normal',
              !!todo.completedAt && 'text-muted-foreground line-through',
            )}
          >
            {todo.name}
          </span>
          {!selectedDepartmentId && todo.department && (
            <span className="text-xs text-muted-foreground">
              {todo.department}
            </span>
          )}
        </div>
      )
    },
  },
  {
    id: 'client',
    accessorFn: (row) => row.client?.name ?? '',
    header: 'Клиент',
    cell: ({ row }) => {
      const todo = row.original
      if (!todo.client)
        return <span className="text-muted-foreground text-sm">—</span>
      return (
        <Link
          to="/clients/$id/view"
          params={{ id: todo.client.id }}
          className="text-sm hover:underline"
        >
          {todo.client.name}
        </Link>
      )
    },
  },
  {
    accessorKey: 'creator',
    header: 'Создал',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.creator}
      </span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Дата
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString('ru-RU')}
      </span>
    ),
  },
  {
    accessorKey: 'responsibles',
    header: 'Ответственные',
    cell: ({ row }) => {
      const responsibles = row.original.responsibles
      if (responsibles.length === 0)
        return <span className="text-muted-foreground text-sm">—</span>
      return (
        <div className="flex flex-wrap gap-2">
          {responsibles.map((name) => (
            <Badge key={name} variant="secondary">
              {name}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: 'deadline',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Срок
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const deadline = row.original.deadline
      return (
        <span className="text-sm text-muted-foreground">
          {deadline ? new Date(deadline).toLocaleDateString('ru-RU') : '—'}
        </span>
      )
    },
  },
  {
    id: 'status',
    accessorFn: (row) => statusOptions[row.status].label,
    header: 'Статус',
    cell: ({ row }) => {
      const option = statusOptions[row.original.status]
      return <Badge variant={option.variant}>{option.label}</Badge>
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const todo = row.original
      return (
        <div className="flex items-center justify-end gap-1">
          <Button asChild variant="ghost" size="icon-sm">
            <Link to="/todos/$id/view" params={{ id: todo.id }}>
              <EyeIcon />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon-sm">
            <Link to="/todos/$id/update" params={{ id: todo.id }}>
              <EditIcon />
            </Link>
          </Button>
          <Button asChild variant="destructiveGhost" size="icon-sm">
            <Link to="/todos/$id/delete" params={{ id: todo.id }}>
              <Trash2Icon />
            </Link>
          </Button>
        </div>
      )
    },
  },
]
