import * as React from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { XIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/user-cols'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import { fetchUsers } from '@/components/users/actions'
import { Button } from '@/components/ui/button'
import { roleLabels, roles } from '@/utils/roleLabels'
import type { UserRow } from '@/types'

export const Route = createFileRoute('/users')({
  loader: () => fetchUsers(),
  component: RouteComponent,
})

const ROLE_OPTIONS: Array<TableFilterOption> = roles.map((r) => ({
  value: r,
  label: roleLabels[r] ?? r,
}))

const BANNED_OPTIONS: Array<TableFilterOption> = [
  { value: 'false', label: 'Активные' },
  { value: 'true', label: 'Заблокированные' },
]

function RouteComponent() {
  const data = Route.useLoaderData()

  const userRows: UserRow[] = data.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role ?? null,
    banned: u.banned ?? null,
    createdAt: new Date(u.createdAt),
  }))

  const [roleFilter, setRoleFilter] = React.useState<string[]>([])
  const [bannedFilter, setBannedFilter] = React.useState<string[]>([])

  const hasFilters = roleFilter.length > 0 || bannedFilter.length > 0

  const filtered = userRows.filter((u) => {
    if (roleFilter.length > 0 && !roleFilter.includes(u.role ?? 'user'))
      return false
    if (
      bannedFilter.length > 0 &&
      !bannedFilter.includes(String(u.banned ?? false))
    )
      return false
    return true
  })

  return (
    <>
      <DataTable
        columns={columns}
        data={filtered}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <MultiFilterCombobox
              options={ROLE_OPTIONS}
              value={roleFilter}
              onValueChange={setRoleFilter}
              placeholder="Роли"
              emptyText="Роли не найдены"
            />
            <MultiFilterCombobox
              options={BANNED_OPTIONS}
              value={bannedFilter}
              onValueChange={setBannedFilter}
              placeholder="Статус"
              emptyText="Статусы не найдены"
            />
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRoleFilter([])
                  setBannedFilter([])
                }}
              >
                <XIcon className="size-4" />
                Сбросить
              </Button>
            )}
          </div>
        }
      />
      <Outlet />
    </>
  )
}
