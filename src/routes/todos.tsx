import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { useDepartmentStore } from '@/stores/department-store'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/todos/todos-cols'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import { ListTodoIcon, Plus } from 'lucide-react'
import { fetchTodos } from '@/components/todos/actions'

export const Route = createFileRoute('/todos')({
  component: RouteComponent,
  loader: () => fetchTodos(),
})

function RouteComponent() {
  const todos = Route.useLoaderData()
  const selectedDepartmentId = useDepartmentStore((s) => s.selectedDepartmentId)

  const filteredTodos = selectedDepartmentId
    ? todos.filter((t) => t.departmentId === selectedDepartmentId)
    : todos

  const completedCount = filteredTodos.filter((t) => t.completedAt).length
  const totalCount = filteredTodos.length

  return (
    <>
      <div className="flex justify-between items-center gap-4 pb-4">
        <Badge className="p-2 px-4">
          Выполнено {completedCount} из {totalCount}
        </Badge>
      </div>

      {filteredTodos.length === 0 ? (
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
        <DataTable columns={columns} data={filteredTodos} />
      )}

      <Outlet />
    </>
  )
}
