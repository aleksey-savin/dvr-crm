import { useState } from 'react'
import { XIcon, UsersIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import { DataTable } from '@/components/tables/data-table'
import { employeeColumns } from '@/components/tables/employees-cols'
import type { DepartmentRow, EmployeeRow } from '@/types'

export function EmployeesTable({
  departments,
  users,
}: {
  departments: DepartmentRow[]
  users: EmployeeRow[]
}) {
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([])

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

  const departmentOptions: Array<TableFilterOption> = [
    { value: '__none__', label: 'Без подразделения' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ]

  const filteredUsers =
    departmentFilter.length === 0
      ? users
      : users.filter(
          (user) =>
            (departmentFilter.includes('__none__') && !user.departmentId) ||
            (!!user.departmentId &&
              departmentFilter.includes(user.departmentId)),
        )

  const toolbar = departmentOptions.length > 0 && (
    <div className="flex items-center gap-2">
      <MultiFilterCombobox
        options={departmentOptions}
        value={departmentFilter}
        onValueChange={setDepartmentFilter}
        placeholder="Подразделения"
        emptyText="Подразделения не найдены"
      />
      {departmentFilter.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDepartmentFilter([])}
        >
          <XIcon className="size-4" />
          Сбросить
        </Button>
      )}
    </div>
  )

  return (
    <DataTable
      columns={employeeColumns}
      data={filteredUsers}
      toolbar={toolbar || undefined}
      tableClassName="text-base"
    />
  )
}
