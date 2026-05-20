import { useState } from 'react'
import type { Column, ColumnDef, SortingState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, SearchIcon, UsersIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { DepartmentRow, EmployeeRow } from '@/types'

export function EmployeesTable({
  departments,
  users,
}: {
  departments: DepartmentRow[]
  users: EmployeeRow[]
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([])

  const departmentNames = new Map(
    departments.map((item) => [item.id, item.name]),
  )

  const departmentOptions: Array<TableFilterOption> = [
    { value: '__none__', label: 'Без подразделения' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ]

  const normalizedSearch = search.trim().toLocaleLowerCase('ru-RU')

  const filteredUsers = users.filter((user) => {
    const departmentName = user.departmentId
      ? (departmentNames.get(user.departmentId) ?? '')
      : ''

    const matchesDepartment =
      departmentFilter.length === 0 ||
      (departmentFilter.includes('__none__') && !user.departmentId) ||
      (!!user.departmentId && departmentFilter.includes(user.departmentId))

    const searchableText = [
      user.name,
      user.position,
      user.phone,
      user.email,
      departmentName,
      formatDateTime(user.lastActivityAt),
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('ru-RU')

    return (
      matchesDepartment &&
      (!normalizedSearch || searchableText.includes(normalizedSearch))
    )
  })

  const columns: ColumnDef<EmployeeRow>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} label="Имя" />,
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      id: 'department',
      accessorFn: (row) =>
        row.departmentId ? (departmentNames.get(row.departmentId) ?? '') : '',
      header: ({ column }) => (
        <SortableHeader column={column} label="Подразделение" />
      ),
      cell: ({ row }) =>
        row.original.departmentId
          ? (departmentNames.get(row.original.departmentId) ?? '—')
          : '—',
    },
    {
      accessorKey: 'position',
      header: ({ column }) => (
        <SortableHeader column={column} label="Должность" />
      ),
      cell: ({ row }) => row.original.position ?? '—',
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => (
        <SortableHeader column={column} label="Телефон" />
      ),
      cell: ({ row }) =>
        row.original.phone ? (
          <a
            href={`tel:${row.original.phone}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            {row.original.phone}
          </a>
        ) : (
          '—'
        ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <SortableHeader column={column} label="Email" />,
      cell: ({ row }) => (
        <a
          href={`mailto:${row.original.email}`}
          className="text-foreground underline-offset-4 hover:underline"
        >
          {row.original.email}
        </a>
      ),
    },
    {
      id: 'lastActivityAt',
      accessorFn: (row) => {
        if (!row.lastActivityAt) return 0
        const date = new Date(row.lastActivityAt)
        return Number.isNaN(date.getTime()) ? 0 : date.getTime()
      },
      header: ({ column }) => (
        <SortableHeader column={column} label="Последняя активность" />
      ),
      cell: ({ row }) => formatDateTime(row.original.lastActivityAt),
    },
  ]

  const table = useReactTable({
    data: filteredUsers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const hasFilters = search.trim().length > 0 || departmentFilter.length > 0

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
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1 md:max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск сотрудников..."
            className="pl-9"
          />
        </div>
        <MultiFilterCombobox
          options={departmentOptions}
          value={departmentFilter}
          onValueChange={setDepartmentFilter}
          placeholder="Подразделения"
          emptyText="Подразделения не найдены"
        />
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('')
              setDepartmentFilter([])
            }}
          >
            <XIcon className="size-4" />
            Сбросить
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Ничего не найдено
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function SortableHeader({
  column,
  label,
}: {
  column: Column<EmployeeRow>
  label: string
}) {
  return (
    <Button
      variant="ghost"
      className="-ml-3 font-semibold"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className="size-4" />
    </Button>
  )
}

function formatDateTime(value: Date | string | null) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('ru-RU')
}
