import * as React from 'react'
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  FilterFn,
  Row,
} from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface GroupByConfig<TData> {
  getKey: (row: TData) => string
  groups: Array<{ key: string; label: string }>
}

interface RowReorderConfig<TData> {
  getId: (row: TData) => string
  canDrag?: (row: TData) => boolean
  onDrop: (args: {
    activeId: string
    overId?: string
    groupKey?: string
    rows: TData[]
  }) => void | Promise<void>
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  toolbar?: React.ReactNode
  hideSearch?: boolean
  rowClassName?: (row: TData) => string
  groupBy?: GroupByConfig<TData>
  rowReorder?: RowReorderConfig<TData>
  onRowClick?: (row: TData) => void
  /** Extra classes for the inner <Table> (e.g. a larger font for one table). */
  tableClassName?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  toolbar,
  hideSearch,
  rowClassName,
  groupBy,
  rowReorder,
  onRowClick,
  tableClassName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )

  const [globalFilter, setGlobalFilter] = React.useState('')
  const [draggingId, setDraggingId] = React.useState<string | null>(null)
  const [overId, setOverId] = React.useState<string | null>(null)
  const [overGroupKey, setOverGroupKey] = React.useState<string | null>(null)

  const clearDrag = () => {
    setDraggingId(null)
    setOverId(null)
    setOverGroupKey(null)
  }

  const globalFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
    const searchValue = filterValue.toLowerCase()
    const cellValue = row.getValue(columnId)

    // Handle arrays (like managers column)
    if (Array.isArray(cellValue)) {
      return cellValue.some((item) =>
        String(item).toLowerCase().includes(searchValue),
      )
    }

    // Handle other values
    return String(cellValue).toLowerCase().includes(searchValue)
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: globalFilterFn,
    getColumnCanGlobalFilter: () => true,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  const renderDataRow = (row: Row<TData>, groupKey?: string) => {
    const rowId = rowReorder?.getId(row.original)
    const isDraggable =
      !!rowReorder && (rowReorder.canDrag?.(row.original) ?? true)

    return (
      <TableRow
        key={row.id}
        data-state={row.getIsSelected() && 'selected'}
        draggable={isDraggable}
        onDragStart={(event) => {
          if (!rowId || !isDraggable) return
          event.dataTransfer.effectAllowed = 'move'
          event.dataTransfer.setData('text/plain', rowId)
          setDraggingId(rowId)
        }}
        onDragOver={(event) => {
          if (!rowReorder || !draggingId || draggingId === rowId) return
          event.preventDefault()
          event.dataTransfer.dropEffect = 'move'
          setOverId(rowId ?? null)
          setOverGroupKey(null)
        }}
        onDrop={async (event) => {
          event.preventDefault()
          if (!rowReorder || !draggingId || draggingId === rowId) return
          const activeId = draggingId
          const snapshot = table.getRowModel().rows.map((item) => item.original)
          setOverId(null)
          setOverGroupKey(null)
          // Keep the row dimmed until the server reorder + invalidate lands, so
          // positions resettle in one step instead of flickering mid-drag.
          await rowReorder.onDrop({
            activeId,
            overId: rowId,
            groupKey,
            rows: snapshot,
          })
          setDraggingId(null)
        }}
        onDragEnd={clearDrag}
        onClick={onRowClick ? () => onRowClick(row.original) : undefined}
        className={cn(
          rowClassName?.(row.original),
          isDraggable && 'cursor-grab active:cursor-grabbing',
          onRowClick && 'cursor-pointer',
          rowId && draggingId === rowId && 'opacity-50',
          rowId &&
            overId === rowId &&
            draggingId !== null &&
            draggingId !== rowId &&
            'shadow-[inset_0_2px_0_0_var(--primary)]',
        )}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    )
  }

  return (
    <>
      {(!hideSearch || toolbar) && (
        <div className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
          {!hideSearch && (
            <Input
              placeholder="Поиск..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />
          )}
          {toolbar}
        </div>
      )}
      <div className="overflow-hidden rounded-md border">
        <Table className={tableClassName}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {(() => {
              const sortedRows = table.getRowModel().rows
              if (!sortedRows.length) {
                return (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )
              }
              if (groupBy) {
                const buckets = new Map(
                  groupBy.groups.map((g) => [g.key, [] as typeof sortedRows]),
                )
                for (const row of sortedRows) {
                  buckets.get(groupBy.getKey(row.original))?.push(row)
                }
                return groupBy.groups.flatMap(({ key, label }) => {
                  const groupRows = buckets.get(key) ?? []
                  if (!groupRows.length) return []
                  return [
                    <TableRow
                      key={`__group__${key}`}
                      onDragOver={(event) => {
                        if (!rowReorder || !draggingId) return
                        event.preventDefault()
                        event.dataTransfer.dropEffect = 'move'
                        setOverGroupKey(key)
                        setOverId(null)
                      }}
                      onDrop={async (event) => {
                        event.preventDefault()
                        if (!rowReorder || !draggingId) return
                        const activeId = draggingId
                        const snapshot = table
                          .getRowModel()
                          .rows.map((item) => item.original)
                        setOverId(null)
                        setOverGroupKey(null)
                        await rowReorder.onDrop({
                          activeId,
                          groupKey: key,
                          rows: snapshot,
                        })
                        setDraggingId(null)
                      }}
                    >
                      <TableCell
                        colSpan={columns.length}
                        className={cn(
                          'bg-muted/50 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                          overGroupKey === key &&
                            draggingId !== null &&
                            'shadow-[inset_0_0_0_2px_var(--primary)]',
                        )}
                      >
                        {label}
                      </TableCell>
                    </TableRow>,
                    ...groupRows.map((row) => renderDataRow(row, key)),
                  ]
                })
              }
              return sortedRows.map((row) => renderDataRow(row))
            })()}
          </TableBody>
          {table
            .getFooterGroups()
            .some((fg) =>
              fg.headers.some((h) => h.column.columnDef.footer),
            ) && (
            <TableFooter>
              {table.getFooterGroups().map((footerGroup) => (
                <TableRow key={footerGroup.id}>
                  {footerGroup.headers.map((header, index) => (
                    <TableCell key={header.id} className="font-semibold">
                      {index === 0
                        ? 'Итого'
                        : header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.footer,
                              header.getContext(),
                            )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableFooter>
          )}
        </Table>
      </div>
    </>
  )
}
