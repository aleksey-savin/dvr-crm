import { toast } from 'sonner'
import {
  TrendingUpIcon,
  TrendingDownIcon,
  TargetIcon,
  PlusIcon,
  Settings2Icon,
} from 'lucide-react'
import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import * as z from 'zod'

import { db } from '@/db'
import { accountGrossProfit, accountTargetForecast } from '@/db/schema'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { Section, YearValueDialog, DeleteRowButton } from './shared'

// ---------------------------------------------------------------------------
// Server fns
// ---------------------------------------------------------------------------

export const addGrossProfit = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      clientId: z.string(),
      year: z.number().int().min(2000).max(2100),
      value: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const existing = await db
      .select({ id: accountGrossProfit.id })
      .from(accountGrossProfit)
      .where(
        and(
          eq(accountGrossProfit.companyAccountId, data.clientId),
          eq(accountGrossProfit.year, data.year),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      throw new Error(
        `Запись ВП за ${data.year} год уже существует для этого клиента`,
      )
    }

    await db.insert(accountGrossProfit).values({
      companyAccountId: data.clientId,
      year: data.year,
      value: data.value,
    })
  })

export const deleteGrossProfit = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .delete(accountGrossProfit)
      .where(eq(accountGrossProfit.id, data.id))
  })

export const addTargetForecast = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      clientId: z.string(),
      year: z.number().int().min(2000).max(2100),
      value: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const existing = await db
      .select({ id: accountTargetForecast.id })
      .from(accountTargetForecast)
      .where(
        and(
          eq(accountTargetForecast.companyAccountId, data.clientId),
          eq(accountTargetForecast.year, data.year),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      throw new Error(
        `Прогноз за ${data.year} год уже существует для этого клиента`,
      )
    }

    await db.insert(accountTargetForecast).values({
      companyAccountId: data.clientId,
      year: data.year,
      value: data.value,
    })
  })

export const deleteTargetForecast = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .delete(accountTargetForecast)
      .where(eq(accountTargetForecast.id, data.id))
  })

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GrossProfit = {
  id: string
  year: number
  value: string
  createdAt: Date
}

type TargetForecast = {
  id: string
  year: number
  value: string
  createdAt: Date
}

type Props = {
  grossProfits: GrossProfit[]
  targetForecasts: TargetForecast[]
  clientId: string
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

function calcDelta(
  gpValue: string | undefined,
  forecastValue: string | undefined,
): { pct: number; positive: boolean } | null {
  if (!gpValue || !forecastValue) return null
  const base = Number(gpValue)
  if (base === 0) return null
  const pct = ((Number(forecastValue) - base) / Math.abs(base)) * 100
  return { pct, positive: pct >= 0 }
}

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

// ---------------------------------------------------------------------------
// Manage dialog content
// ---------------------------------------------------------------------------

function ManageDialog({
  grossProfits,
  targetForecasts,
  clientId,
  onRefresh,
}: Props) {
  return (
    <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Финансовые данные</DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-1">
        {/* ---- Gross profits ---- */}
        <Section
          icon={TrendingUpIcon}
          title="Валовая прибыль"
          action={
            <YearValueDialog
              title="Добавить валовую прибыль"
              onAdd={async (year, value) => {
                await addGrossProfit({ data: { clientId, year, value } })
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
          {grossProfits.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              Данных нет
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Год</TableHead>
                  <TableHead>Значение</TableHead>
                  <TableHead>Добавлен</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {grossProfits
                  .slice()
                  .sort((a, b) => b.year - a.year)
                  .map((gp) => (
                    <TableRow key={gp.id}>
                      <TableCell className="font-medium">{gp.year}</TableCell>
                      <TableCell>{fmtNum(gp.value)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {fmtDate(gp.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DeleteRowButton
                          onDelete={async () => {
                            await deleteGrossProfit({ data: { id: gp.id } })
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

        <Separator />

        {/* ---- Target forecasts ---- */}
        <Section
          icon={TargetIcon}
          title="Целевой прогноз"
          action={
            <YearValueDialog
              title="Добавить прогноз"
              onAdd={async (year, value) => {
                await addTargetForecast({ data: { clientId, year, value } })
                toast.success('Прогноз добавлен')
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
          {targetForecasts.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              Прогнозов нет
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Год</TableHead>
                  <TableHead>Значение</TableHead>
                  <TableHead>Добавлен</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {targetForecasts
                  .slice()
                  .sort((a, b) => b.year - a.year)
                  .map((tf) => (
                    <TableRow key={tf.id}>
                      <TableCell className="font-medium">{tf.year}</TableCell>
                      <TableCell>{fmtNum(tf.value)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {fmtDate(tf.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DeleteRowButton
                          onDelete={async () => {
                            await deleteTargetForecast({ data: { id: tf.id } })
                            toast.success('Прогноз удалён')
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

export function ProfitForecastSection({
  grossProfits,
  targetForecasts,
  clientId,
  onRefresh,
}: Props) {
  const currentYear = new Date().getFullYear()
  const lastYearGP = grossProfits.find((gp) => gp.year === currentYear - 1)
  const currentYearForecast = targetForecasts.find(
    (tf) => tf.year === currentYear,
  )

  return (
    <div className="flex items-start gap-3">
      {/* Summary cards */}
      <div className="flex-1 grid grid-cols-2 gap-2">
        <Card className="flex flex-col gap-1 p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUpIcon className="size-3.5" />
            Валовая прибыль {currentYear - 1}
          </div>
          <div className="text-2xl font-semibold tracking-tight">
            {lastYearGP ? (
              fmtNum(lastYearGP.value)
            ) : (
              <span className="text-muted-foreground text-base font-normal">
                Нет данных
              </span>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-1 p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TargetIcon className="size-3.5" />
            Прогноз {currentYear}
          </div>
          <div className="text-2xl font-semibold tracking-tight">
            {currentYearForecast ? (
              fmtNum(currentYearForecast.value)
            ) : (
              <span className="text-muted-foreground text-base font-normal">
                Нет данных
              </span>
            )}
          </div>
          {(() => {
            const delta = calcDelta(
              lastYearGP?.value,
              currentYearForecast?.value,
            )
            if (!delta) return null
            return (
              <div
                className={`flex items-center gap-1 text-xs font-medium mt-0.5 ${
                  delta.positive ? 'text-emerald-600' : 'text-destructive'
                }`}
              >
                {delta.positive ? (
                  <TrendingUpIcon className="size-3.5 shrink-0" />
                ) : (
                  <TrendingDownIcon className="size-3.5 shrink-0" />
                )}
                {delta.positive ? '+' : ''}
                {delta.pct.toFixed(1)}% к ВП {currentYear - 1}
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
          grossProfits={grossProfits}
          targetForecasts={targetForecasts}
          clientId={clientId}
          onRefresh={onRefresh}
        />
      </Dialog>
    </div>
  )
}
