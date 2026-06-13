import { Link } from '@tanstack/react-router'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  ClientManagerFact,
  ReportManager,
  ReportSegmentData,
} from '@/types'

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

function money(value: number | null | undefined) {
  return value ? currency.format(value) : '—'
}

// факт / план
function percent(value: number, base: number) {
  if (base === 0) return '—'
  return `${Math.round((value / base) * 100)}%`
}

// Client × manager × year matrix — mirrors the «ГКС» sheet client block.
// Body: each client row shows every manager's ВП for the prior and current
// year + the ГКС total.
// Footer (per manager + ГКС), two rows:
//   • Факт — prior year sum, current year «сумма / % к прошлому году»
//   • План — per-client target «сумма / % выполнения (факт / план)»
export function ClientManagerMatrix({
  title,
  managers,
  data,
  lastYear,
  year,
}: {
  title: string
  managers: ReportManager[]
  data: ReportSegmentData
  lastYear: number
  year: number
}) {
  const byManager = new Map(data.byManager.map((c) => [c.managerId, c]))

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {data.rows.length === 0 ? (
        <p className="py-2 text-sm italic text-muted-foreground">
          Клиентов нет
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="align-bottom font-semibold">
                  Клиент
                </TableHead>
                {managers.map((m) => (
                  <TableHead
                    key={m.id}
                    colSpan={2}
                    className="border-l text-center font-semibold"
                  >
                    {m.name}
                  </TableHead>
                ))}
                <TableHead
                  colSpan={2}
                  className="border-l text-center font-semibold"
                >
                  ГКС
                </TableHead>
              </TableRow>
              <TableRow>
                {managers.map((m) => (
                  <YearSubHeads key={m.id} lastYear={lastYear} year={year} />
                ))}
                <YearSubHeads lastYear={lastYear} year={year} />
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.accountId}>
                  <TableCell className="whitespace-nowrap font-medium">
                    <Link
                      to="/companies/$id/view"
                      params={{ id: row.companyId }}
                      search={{ tab: row.accountId }}
                      className="hover:underline"
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  {managers.map((m) => {
                    const cell = row.byManager[m.id] as
                      | ClientManagerFact
                      | undefined
                    return (
                      <YearCells
                        key={m.id}
                        lastYear={cell?.lastYearFact}
                        year={cell?.factYtd}
                      />
                    )
                  })}
                  <YearCells
                    lastYear={row.gpLastYear}
                    year={row.factYtd}
                    bold
                  />
                </TableRow>
              ))}
            </TableBody>

            <TableFooter>
              {/* Факт: прошлый год — сумма; текущий — сумма / % к прошлому году */}
              <TableRow className="border-t-2 font-semibold">
                <TableCell>Факт</TableCell>
                {managers.map((m) => {
                  const c = byManager.get(m.id)
                  return (
                    <FactCells
                      key={m.id}
                      lastYear={c?.lastYearFact ?? 0}
                      current={c?.factYtd ?? 0}
                    />
                  )
                })}
                <FactCells
                  lastYear={data.totals.lastYearFact}
                  current={data.totals.factYtd}
                />
              </TableRow>

              {/* План (цель по клиенту) — сумма / % выполнения (факт / план) */}
              <TableRow className="font-semibold">
                <TableCell>План</TableCell>
                {managers.map((m) => {
                  const c = byManager.get(m.id)
                  return (
                    <TableCell
                      key={m.id}
                      colSpan={2}
                      className="border-l text-right tabular-nums"
                    >
                      {money(c?.forecast ?? 0)} /{' '}
                      {percent(c?.factYtd ?? 0, c?.forecast ?? 0)}
                    </TableCell>
                  )
                })}
                <TableCell
                  colSpan={2}
                  className="border-l text-right tabular-nums"
                >
                  {money(data.totals.forecast)} /{' '}
                  {percent(data.totals.factYtd, data.totals.forecast)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  )
}

// Footer «Факт» cells for one manager (or the ГКС total): prior year is the
// plain sum; the current year shows «сумма / % к прошлому году».
function FactCells({
  lastYear,
  current,
}: {
  lastYear: number
  current: number
}) {
  return (
    <>
      <TableCell className="border-l text-right tabular-nums">
        {money(lastYear)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {money(current)} / {percent(current, lastYear)}
      </TableCell>
    </>
  )
}

function YearSubHeads({ lastYear, year }: { lastYear: number; year: number }) {
  return (
    <>
      <TableHead className="border-l text-right text-xs font-medium">
        {lastYear}
      </TableHead>
      <TableHead className="text-right text-xs font-medium">{year}</TableHead>
    </>
  )
}

function YearCells({
  lastYear,
  year,
  bold,
}: {
  lastYear: number | null | undefined
  year: number | null | undefined
  bold?: boolean
}) {
  return (
    <>
      <TableCell
        className={`border-l text-right tabular-nums ${bold ? 'font-medium' : ''}`}
      >
        {money(lastYear)}
      </TableCell>
      <TableCell
        className={`text-right tabular-nums ${bold ? 'font-medium' : ''}`}
      >
        {money(year)}
      </TableCell>
    </>
  )
}
