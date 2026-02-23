import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { db } from '@/db'
import { todo } from '@/db/schema'
import { cn } from '@/lib/utils'
import {
  createFileRoute,
  Link,
  Outlet,
  useRouter,
} from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { EditIcon, EyeIcon, ListTodoIcon, Plus, Trash2Icon } from 'lucide-react'
import z from 'zod'

const fetchTodos = createServerFn().handler(async () => {
  return await db.query.todo.findMany({
    with: {
      creator: {
        columns: {
          name: true,
        },
      },
      responsibleUsers: {
        with: {
          user: {
            columns: {
              name: true,
            },
          },
        },
      },
    },
  })
})

const toggleFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ id: z.string().min(1), completedAt: z.date().nullable() }),
  )
  .handler(async ({ data }) => {
    await db
      .update(todo)
      .set({ completedAt: data.completedAt })
      .where(eq(todo.id, data.id))
  })

export const Route = createFileRoute('/todos')({
  component: RouteComponent,
  loader: () => fetchTodos(),
})

function RouteComponent() {
  const todos = Route.useLoaderData()

  const completedCount = todos.filter((t) => t.completedAt).length
  const totalCount = todos.length

  const router = useRouter()

  const toggleFnServer = useServerFn(toggleFn)

  const statusOptions = [
    { status: 'not started', label: 'не в работе', badgeVariant: 'warning' },
    { status: 'in progress', label: 'в работе', badgeVariant: 'default' },
    { status: 'completed', label: 'выполнена', badgeVariant: 'success' },
  ] as const

  return (
    <>
      <div className="flex justify-between items-center gap-4">
        <div>
          <Button asChild>
            <Link to="/todos/new" className="flex items-center gap-2">
              <Plus /> Создать
            </Link>
          </Button>
        </div>
        <div className="space-y-2">
          <Badge>
            Выполнено {completedCount} из {totalCount}
          </Badge>
        </div>
      </div>
      {todos.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListTodoIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Нет активных задач</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/todos/new" className="flex items-center gap-2">
                <Plus /> Создать
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left"></TableHead>
              <TableHead>Описание</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Поздразделение</TableHead>
              <TableHead>Создана</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Ответственные</TableHead>
              <TableHead>Срок выполнения</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right w-0"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {todos?.map((item) => (
              <TableRow
                key={item.id}
                onClick={async (e) => {
                  const target = e.target as HTMLElement
                  if (target.closest('[data-actions]')) return
                  await toggleFnServer({
                    data: {
                      id: item.id,
                      completedAt: item.completedAt ? null : new Date(),
                    },
                  })
                  router.invalidate()
                }}
              >
                <TableCell>
                  <Checkbox checked={!!item.completedAt} />
                </TableCell>
                <TableCell
                  className={cn(
                    !!item.completedAt && 'text-muted-foreground line-through',
                    'font-medium wrap-break-word whitespace-normal min-w-48',
                  )}
                >
                  {item.name}
                </TableCell>
                <TableCell className={cn('text-muted-foreground text-sm')}>
                  ---
                </TableCell>
                <TableCell className={cn('text-muted-foreground text-sm')}>
                  ---
                </TableCell>
                <TableCell className={cn('text-muted-foreground text-sm')}>
                  {item.creator.name}
                </TableCell>
                <TableCell className={cn('text-muted-foreground text-sm')}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className={cn('text-muted-foreground text-sm')}>
                  {item.responsibleUsers.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {item.responsibleUsers.map(({ user }) => (
                        <Badge key={user.name} variant="secondary">
                          {user.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    '---'
                  )}
                </TableCell>
                <TableCell className={cn('text-muted-foreground text-sm')}>
                  {item.deadline
                    ? new Date(item.deadline).toLocaleDateString()
                    : '---'}
                </TableCell>
                <TableCell className={cn('text-muted-foreground text-sm')}>
                  <Badge
                    variant={
                      statusOptions.find(
                        (option) => option.status === item.status,
                      )?.badgeVariant
                    }
                  >
                    {
                      statusOptions.find(
                        (option) => option.status === item.status,
                      )?.label
                    }
                  </Badge>
                </TableCell>
                <TableCell className="text-right" data-actions>
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="icon-sm">
                      <Link to="/todos/$id/view" params={{ id: item.id }}>
                        <EyeIcon />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon-sm">
                      <Link to="/todos/$id/update" params={{ id: item.id }}>
                        <EditIcon />
                      </Link>
                    </Button>
                    <Button asChild variant="destructiveGhost" size="icon-sm">
                      <Link to="/todos/$id/delete" params={{ id: item.id }}>
                        <Trash2Icon />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Outlet />
    </>
  )
}
