import * as React from 'react'
import { toast } from 'sonner'
import { TrendingUpIcon, PlusIcon, Settings2Icon } from 'lucide-react'
import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import * as z from 'zod'

import { db } from '@/db'
import { companyRevenue } from '@/db/schema'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  Section,
  YearValueDialog,
  DeleteRowButton,
} from '@/components/client-view/shared'

// ---------------------------------------------------------------------------
// Server fns
// ---------------------------------------------------------------------------

export const addRevenue = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      companyId: z.string(),
      year: z.number().int().min(2000).max(2100),
      value: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const existing = await db
      .select({ id: companyRevenue.id })
      .from(companyRevenue)
      .where(
        and(
          eq(companyRevenue.companyId, data.companyId),
          eq(companyRevenue.year, data.year),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      throw new Error(
        `Выручка за ${data.year} год уже добавлена для этой компании`,
      )
    }

    await db.insert(companyRevenue).values({
      companyId: data.companyId,
      year: data.year,
      value: data.value,
    })
  })

export const deleteRevenue = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(companyRevenue).where(eq(companyRevenue.id, data.id))
  })

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Revenue = {
  id: string
  year: number
  value: string
  createdAt: Date
}

type Props = {
  revenues: Revenue[]
  companyId: string
  onRefresh: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtNum = (v: string) =>
  Number(v).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

// ---------------------------------------------------------------------------
// Manage dialog
// ---------------------------------------------------------------------------

function ManageDialog({ revenues, companyId, onRefresh }: Props) {
  return (
    <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Выручка компании</DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto pr-1">
        <Section
          icon={TrendingUpIcon}
          title="Выручка по годам"
          action={
            <YearValueDialog
              title="Добавить выручку"
              onAdd={async (year, value) => {
                await addRevenue({ data: { companyId, year, value } })
                toast.success('Запись добавлена')
                onRefresh()
              }}
            >
              <Button size="sm" variant="outline" className="gap-1.5">
                <PlusIcon className="size-3.5" />
                Добавить
              </Button>
            </YearValueDialog>
          }
        >
          {revenues.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              Данных нет
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Год</TableHead>
                  <TableHead>Выручка</TableHead>
                  <TableHead>Добавлен</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues
                  .slice()
                  .sort((a, b) => b.year - a.year)
                  .map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.year}</TableCell>
                      <TableCell>{fmtNum(r.value)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {fmtDate(r.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DeleteRowButton
                          onDelete={async () => {
                            await deleteRevenue({ data: { id: r.id } })
                            toast.success('Запись удалена')
                            onRefresh()
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </Section>
      </div>
    </DialogContent>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function RevenueSection({ revenues, companyId, onRefresh }: Props) {
  const currentYear = new Date().getFullYear()
  const lastYearRevenue = revenues.find((r) => r.year === currentYear - 1)
  const twoYearsAgoRevenue = revenues.find((r) => r.year === currentYear - 2)

  return (
    <div className="flex items-start gap-3">
      {/* Summary cards */}
      <div className="flex-1 grid grid-cols-2 gap-2">
        <Card className="flex flex-col gap-1 p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUpIcon className="size-3.5" />
            Выручка {currentYear - 2}
          </div>
          <div className="text-2xl font-semibold tracking-tight">
            {twoYearsAgoRevenue ? (
              fmtNum(twoYearsAgoRevenue.value)
            ) : (
              <span className="text-muted-foreground text-base font-normal">
                Нет данных
              </span>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-1 p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUpIcon className="size-3.5" />
            Выручка {currentYear - 1}
          </div>
          <div className="text-2xl font-semibold tracking-tight">
            {lastYearRevenue ? (
              fmtNum(lastYearRevenue.value)
            ) : (
              <span className="text-muted-foreground text-base font-normal">
                Нет данных
              </span>
            )}
          </div>
          {twoYearsAgoRevenue &&
            lastYearRevenue &&
            (() => {
              const base = Number(twoYearsAgoRevenue.value)
              if (base === 0) return null
              const pct =
                ((Number(lastYearRevenue.value) - base) / Math.abs(base)) * 100
              const positive = pct >= 0
              return (
                <div
                  className={`flex items-center gap-1 text-xs font-medium mt-0.5 ${
                    positive ? 'text-emerald-600' : 'text-destructive'
                  }`}
                >
                  <TrendingUpIcon className="size-3.5 shrink-0" />
                  {positive ? '+' : ''}
                  {pct.toFixed(1)}% к {currentYear - 2}
                </div>
              )
            })()}
        </Card>
      </div>

      {/* Manage button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 self-start mt-0.5 shrink-0"
          >
            <Settings2Icon className="size-3.5" />
            Управлять
          </Button>
        </DialogTrigger>
        <ManageDialog
          revenues={revenues}
          companyId={companyId}
          onRefresh={onRefresh}
        />
      </Dialog>
    </div>
  )
}
