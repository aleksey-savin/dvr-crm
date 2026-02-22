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
import { todos } from '@/db/schema'
import { cn } from '@/lib/utils'
import {
  createFileRoute,
  Link,
  Outlet,
  useRouter,
} from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { EditIcon, ListTodoIcon, Plus, Trash2Icon } from 'lucide-react'
import z from 'zod'

const fetchTodos = createServerFn().handler(async () => {
  return db.query.todos.findMany()
})

const toggleFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ id: z.string().min(1), completedAt: z.date().nullable() }),
  )
  .handler(async ({ data }) => {
    await db
      .update(todos)
      .set({ completedAt: data.completedAt })
      .where(eq(todos.id, data.id))
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
              <TableHead>Ответственный</TableHead>
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
                  ---
                </TableCell>

                <TableCell className={cn('text-muted-foreground text-sm')}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className={cn('text-muted-foreground text-sm')}>
                  ---
                </TableCell>
                <TableCell className="text-right" data-actions>
                  <div className="flex items-center justify-end gap-1">
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
