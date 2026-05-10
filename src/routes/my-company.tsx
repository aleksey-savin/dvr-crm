import type { DepartmentRow } from '@/components/departments/department-tree'
import { DepartmentTree } from '@/components/departments/department-tree'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { db } from '@/db'
import {
  createFileRoute,
  Link,
  Outlet,
  useRouter,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ListTodoIcon, Plus, UsersIcon } from 'lucide-react'

const myCompanyTabs = ['employees', 'structure'] as const
type MyCompanyTab = (typeof myCompanyTabs)[number]

const fetchMyCompanyData = createServerFn().handler(async () => {
  const [departments, users] = await Promise.all([
    db.query.department.findMany({
      with: {
        head: {
          columns: {
            id: true,
            name: true,
            role: true,
            image: true,
          },
        },
        users: {
          columns: {
            id: true,
            name: true,
            role: true,
            image: true,
          },
        },
      },
      orderBy: (department, { asc }) => [asc(department.name)],
    }),
    db.query.user.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
      },
      with: {
        sessions: {
          columns: {
            updatedAt: true,
          },
          orderBy: (session, { desc }) => [desc(session.updatedAt)],
          limit: 1,
        },
      },
      orderBy: (user, { asc }) => [asc(user.name)],
    }),
  ])

  return {
    departments,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      mobileNumber: null,
      lastActivityAt: user.sessions.at(0)?.updatedAt ?? null,
    })),
  }
})

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
          <EmployeesTable users={users} />
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
            <DepartmentTree departments={departments as DepartmentRow[]} />
          )}
        </TabsContent>
      </Tabs>

      <Outlet />
    </>
  )
}

type EmployeeRow = {
  id: string
  name: string
  email: string
  mobileNumber: string | null
  lastActivityAt: Date | string | null
}

function EmployeesTable({ users }: { users: EmployeeRow[] }) {
  if (users.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
        </EmptyHeader>
        <EmptyDescription>Нет сотрудников</EmptyDescription>
      </Empty>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Имя</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Мобильный номер</TableHead>
            <TableHead>Последняя активность</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.mobileNumber ?? '—'}</TableCell>
              <TableCell>{formatDateTime(user.lastActivityAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function formatDateTime(value: Date | string | null) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('ru-RU')
}
