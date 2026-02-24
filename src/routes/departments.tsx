import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { cn } from '@/lib/utils'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { EditIcon, EyeIcon, ListTodoIcon, Plus, Trash2Icon } from 'lucide-react'

const fetchTodos = createServerFn().handler(async () => {
  return await db.query.department.findMany()
})

export const Route = createFileRoute('/departments')({
  component: RouteComponent,
  loader: () => fetchTodos(),
})

function RouteComponent() {
  const departments = Route.useLoaderData()

  return (
    <>
      <div className="flex justify-between items-center gap-4 pb-4">
        <div>
          <Button asChild>
            <Link to="/departments/new" className="flex items-center gap-2">
              <Plus /> Создать
            </Link>
          </Button>
        </div>
      </div>
      {departments.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListTodoIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Нет бизнес-юнитов</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/departments/new" className="flex items-center gap-2">
                <Plus /> Создать
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Наименование</TableHead>
              <TableHead className="text-right w-0"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-right" data-actions>
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="icon-sm">
                      <Link to="/departments/$id/view" params={{ id: item.id }}>
                        <EyeIcon />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon-sm">
                      <Link
                        to="/departments/$id/update"
                        params={{ id: item.id }}
                      >
                        <EditIcon />
                      </Link>
                    </Button>
                    <Button asChild variant="destructiveGhost" size="icon-sm">
                      <Link
                        to="/departments/$id/delete"
                        params={{ id: item.id }}
                      >
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
