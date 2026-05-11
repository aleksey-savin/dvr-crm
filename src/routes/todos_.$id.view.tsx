import '@/components/tiptap/tiptap.css'
import { TodoActions } from '@/components/todos/todo-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  CalendarIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  ClockIcon,
  EditIcon,
  Trash2Icon,
} from 'lucide-react'
import { TodoComments } from '@/components/todos/todo-comments'
import { fetchTodo } from '@/components/todos/actions'

export const Route = createFileRoute('/todos_/$id/view')({
  component: RouteComponent,
  loader: async ({ params }) => fetchTodo({ data: params }),
})

const statusConfig = {
  'not started': {
    label: 'Не в работе',
    variant: 'warning' as const,
    icon: CircleDashedIcon,
  },
  'in progress': {
    label: 'В работе',
    variant: 'default' as const,
    icon: ClockIcon,
  },
  completed: {
    label: 'Выполнена',
    variant: 'success' as const,
    icon: CheckCircle2Icon,
  },
}

function RouteComponent() {
  const item = Route.useLoaderData()

  const status = statusConfig[item.status]
  const StatusIcon = status.icon

  const isOverdue = !item.completedAt && new Date(item.deadline) < new Date()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">
      {/* Left column: task details + actions */}
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-0" style={{ height: '79svh' }}>
          {/* Header */}
          <CardHeader className="border-b shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <Badge variant={status.variant} className="gap-1 shrink-0">
                    <StatusIcon className="size-3" />
                    {status.label}
                  </Badge>
                  {item.archivedAt && (
                    <Badge variant="secondary" className="shrink-0">
                      Архив
                    </Badge>
                  )}
                  {isOverdue && (
                    <Badge variant="destructive" className="shrink-0">
                      Просрочена
                    </Badge>
                  )}
                  <h1 className="text-lg font-semibold leading-tight truncate">
                    {item.name}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link to="/todos/$id/update" params={{ id: item.id }}>
                    <EditIcon className="size-4" />
                    Изменить
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="destructiveGhost"
                  size="sm"
                  className="gap-2"
                >
                  <Link to="/todos/$id/delete" params={{ id: item.id }}>
                    <Trash2Icon className="size-4" />
                    Удалить
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 border-b shrink-0 text-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Создана</TableHead>
                  <TableHead>Ответственные</TableHead>
                  <TableHead>Дата создания </TableHead>
                  <TableHead>Срок выполнения</TableHead>
                  {item.completedAt && <TableHead>Дата завершения</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Badge>{item.creator.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.responsibleUsers.map(({ user }) => (
                        <Badge key={user.name} variant="secondary">
                          {user.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ClockIcon className="size-4 shrink-0" />
                      <span>
                        {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="size-4 shrink-0" />
                      <span
                        className={
                          isOverdue ? 'text-destructive font-medium' : ''
                        }
                      >
                        {new Date(item.deadline).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        {isOverdue && ' — просрочена'}
                      </span>
                    </div>
                  </TableCell>
                  {item.completedAt && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
                        <span className="text-emerald-500 font-medium">
                          {new Date(item.completedAt).toLocaleDateString(
                            'ru-RU',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </span>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Scrollable description */}
          <CardContent className="flex-1 min-h-0 overflow-y-auto pt-4">
            {item.description ? (
              <div
                className="ProseMirror"
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground italic">
                  Описание не указано
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <TodoActions item={item} />
      </div>

      {/* Right column: comments (moves below on mobile) */}
      <TodoComments entityType="todo" entityId={item.id} />
    </div>
  )
}
