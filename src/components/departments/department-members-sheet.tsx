import { useEffect, useMemo, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import {
  BriefcaseBusinessIcon,
  CrownIcon,
  EditIcon,
  EyeIcon,
  PlusIcon,
  Trash2Icon,
  UserRoundIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  addDepartmentEmployee,
  removeDepartmentEmployee,
  setDepartmentHead,
} from '@/components/departments/actions'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { DepartmentNode, DepartmentRow, EmployeeRow } from '@/types'
import { getInitials } from './text-utils'

const NO_HEAD_VALUE = 'no-head'
const NO_USER_VALUE = 'no-user'

export function DepartmentMembersSheet({
  department,
  departments,
  users,
  open,
  onOpenChange,
}: {
  department: DepartmentNode | null
  departments: DepartmentRow[]
  users: EmployeeRow[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [headUserId, setHeadUserId] = useState(NO_HEAD_VALUE)
  const [employeeUserId, setEmployeeUserId] = useState(NO_USER_VALUE)
  const [isHeadEditing, setIsHeadEditing] = useState(false)
  const [isEmployeesEditing, setIsEmployeesEditing] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const departmentNames = useMemo(() => {
    return new Map(departments.map((item) => [item.id, item.name]))
  }, [departments])

  useEffect(() => {
    setHeadUserId(department?.headUserId ?? NO_HEAD_VALUE)
    setEmployeeUserId(NO_USER_VALUE)
    setIsHeadEditing(false)
    setIsEmployeesEditing(false)
  }, [department?.id, department?.headUserId])

  if (!department) return null

  const head = department.head
  const regularEmployees = department.users.filter(
    (employee) => employee.id !== head?.id,
  )
  const regularEmployeeIds = new Set(regularEmployees.map((user) => user.id))
  const sortedUsers = [...users].sort((a, b) =>
    a.name.localeCompare(b.name, 'ru'),
  )
  const addableUsers = sortedUsers.filter(
    (user) => user.id !== head?.id && !regularEmployeeIds.has(user.id),
  )

  const refresh = async () => {
    await router.invalidate()
  }

  const handleHeadSave = async () => {
    const nextHeadUserId = headUserId === NO_HEAD_VALUE ? null : headUserId
    setPendingAction('head')
    try {
      await setDepartmentHead({
        data: { departmentId: department.id, userId: nextHeadUserId },
      })
      toast.success(
        nextHeadUserId ? 'Руководитель назначен' : 'Руководитель снят',
      )
      setIsHeadEditing(false)
      await refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось обновить',
      )
    } finally {
      setPendingAction(null)
    }
  }

  const handleEmployeeAdd = async () => {
    if (employeeUserId === NO_USER_VALUE) return

    setPendingAction('add-employee')
    try {
      await addDepartmentEmployee({
        data: { departmentId: department.id, userId: employeeUserId },
      })
      setEmployeeUserId(NO_USER_VALUE)
      toast.success('Сотрудник добавлен')
      await refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось добавить',
      )
    } finally {
      setPendingAction(null)
    }
  }

  const handleEmployeeRemove = async (userId: string) => {
    setPendingAction(`remove-${userId}`)
    try {
      await removeDepartmentEmployee({
        data: { departmentId: department.id, userId },
      })
      toast.success('Сотрудник удален из подразделения')
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось удалить')
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-hidden sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{department.name}</SheetTitle>
          <SheetDescription>
            Руководитель и сотрудники подразделения
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CrownIcon className="size-4" />
                Руководитель
              </div>
              <button
                type="button"
                className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => setIsHeadEditing((value) => !value)}
              >
                {isHeadEditing ? 'Готово' : 'Изменить'}
              </button>
            </div>
            {head ? <PersonRow user={head} /> : <EmptyRow text="Не назначен" />}
            {isHeadEditing && (
              <div className="flex gap-2">
                <Select value={headUserId} onValueChange={setHeadUserId}>
                  <SelectTrigger className="min-w-0 flex-1">
                    <SelectValue placeholder="Выберите руководителя" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_HEAD_VALUE}>
                      Без руководителя
                    </SelectItem>
                    {sortedUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                        {user.position ? ` · ${user.position}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleHeadSave}
                  disabled={pendingAction === 'head'}
                >
                  Сохранить
                </Button>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BriefcaseBusinessIcon className="size-4" />
                Сотрудники
              </div>
              <button
                type="button"
                className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => setIsEmployeesEditing((value) => !value)}
              >
                {isEmployeesEditing ? 'Готово' : 'Изменить'}
              </button>
            </div>
            {isEmployeesEditing && (
              <div className="flex gap-2">
                <Select
                  value={employeeUserId}
                  onValueChange={setEmployeeUserId}
                >
                  <SelectTrigger className="min-w-0 flex-1">
                    <SelectValue placeholder="Добавить сотрудника" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_USER_VALUE}>
                      Выберите сотрудника
                    </SelectItem>
                    {addableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                        {user.departmentId
                          ? ` · ${departmentNames.get(user.departmentId) ?? 'другое подразделение'}`
                          : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  onClick={handleEmployeeAdd}
                  disabled={
                    employeeUserId === NO_USER_VALUE ||
                    pendingAction === 'add-employee'
                  }
                  title="Добавить сотрудника"
                >
                  <PlusIcon />
                </Button>
              </div>
            )}

            {regularEmployees.length === 0 ? (
              <EmptyRow text="Сотрудники не назначены" />
            ) : (
              <div className="flex flex-col gap-3">
                {regularEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="rounded-md border bg-card p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <PersonRow user={employee} />
                      {isEmployeesEditing && (
                        <Button
                          variant="destructiveGhost"
                          size="icon-sm"
                          onClick={() => handleEmployeeRemove(employee.id)}
                          disabled={pendingAction === `remove-${employee.id}`}
                          title="Удалить из подразделения"
                        >
                          <Trash2Icon />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <SheetFooter className="border-t">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button asChild variant="outline">
              <Link
                to="/my-company/$id/view"
                params={{ id: department.id }}
                onClick={() => onOpenChange(false)}
              >
                <EyeIcon />
                Подробнее
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                to="/my-company/$id/update"
                params={{ id: department.id }}
                onClick={() => onOpenChange(false)}
              >
                <EditIcon />
                Изменить
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                to="/my-company/new"
                search={{ parentId: department.id, tab: 'structure' }}
                onClick={() => onOpenChange(false)}
              >
                <PlusIcon />
                Дочернее
              </Link>
            </Button>
            <Button asChild variant="destructiveGhost">
              <Link
                to="/my-company/$id/delete"
                params={{ id: department.id }}
                onClick={() => onOpenChange(false)}
              >
                <Trash2Icon />
                Удалить
              </Link>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function PersonRow({
  user,
}: {
  user: {
    name: string
    position: string | null
    phone: string | null
    image: string | null
  }
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground">
        {user.image ? (
          <img src={user.image} alt="" className="size-full object-cover" />
        ) : (
          getInitials(user.name)
        )}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{user.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {user.position ?? 'Должность не указана'}
        </div>
        {user.phone && (
          <div className="truncate text-xs text-muted-foreground">
            {user.phone}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
      <UserRoundIcon className="size-4" />
      {text}
    </div>
  )
}
