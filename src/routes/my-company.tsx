import { DepartmentTree } from '@/components/departments/department-tree'
import { fetchMyCompanyData } from '@/components/departments/actions'
import { EmployeesTable } from '@/components/users/employees-table'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  createFileRoute,
  Link,
  Outlet,
  useRouter,
} from '@tanstack/react-router'
import { ListTodoIcon, Plus } from 'lucide-react'
import type { DepartmentRow } from '@/types'

const myCompanyTabs = ['employees', 'structure'] as const
type MyCompanyTab = (typeof myCompanyTabs)[number]

export const Route = createFileRoute('/my-company')({
  validateSearch: (search: Record<string, unknown>): { tab?: MyCompanyTab } => {
    if (myCompanyTabs.includes(search.tab as MyCompanyTab)) {
      return { tab: search.tab as MyCompanyTab }
    }

    return {}
  },
  component: RouteComponent,
  loader: () => fetchMyCompanyData(),
})

function RouteComponent() {
  const { departments, users } = Route.useLoaderData()
  const { tab = 'employees' } = Route.useSearch()
  const router = useRouter()

  const handleTabChange = (value: string) => {
    const nextTab: MyCompanyTab =
      value === 'structure' ? 'structure' : 'employees'

    router.navigate({
      to: '/my-company',
      search: { tab: nextTab },
      replace: true,
    })
  }

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={handleTabChange}
        className="min-h-0 flex-1 gap-4"
      >
        <TabsList>
          <TabsTrigger value="employees">Сотрудники</TabsTrigger>
          <TabsTrigger value="structure">Структура компании</TabsTrigger>
        </TabsList>

        <TabsContent
          value="employees"
          className="flex min-h-0 flex-col data-[state=inactive]:hidden"
        >
          <EmployeesTable departments={departments} users={users} />
        </TabsContent>

        <TabsContent
          value="structure"
          className="flex min-h-0 flex-col data-[state=inactive]:hidden"
        >
          {departments.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ListTodoIcon />
                </EmptyMedia>
              </EmptyHeader>
              <EmptyDescription>Нет подразделений</EmptyDescription>
              <EmptyContent>
                <Button asChild>
                  <Link
                    to="/my-company/new"
                    search={{ tab: 'structure' }}
                    className="flex items-center gap-2"
                  >
                    <Plus /> Создать
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <DepartmentTree
              departments={departments as DepartmentRow[]}
              users={users}
            />
          )}
        </TabsContent>
      </Tabs>

      <Outlet />
    </>
  )
}
