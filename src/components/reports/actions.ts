import { db } from '@/db'
import {
  accountTargetForecast,
  companyAccount,
  department,
  grossProfitFact,
  salesPlan,
  user,
} from '@/db/schema'
import type {
  ClientManagerFact,
  CombinedManagerCell,
  ReportManager,
  ReportSegment,
  ReportSegmentData,
  SalesPlanRow,
  SegmentManagerCell,
  TargetClientReportRow,
  TargetClientsReport,
} from '@/types'
import { createServerFn } from '@tanstack/react-start'
import { and, eq, gte, inArray, isNull, lt, sql } from 'drizzle-orm'
import * as z from 'zod'
import { getAccessibleDepartmentIds } from '@/lib/department-scope'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const num = (v: string | number | null | undefined): number =>
  v == null ? 0 : Number(v)

const segmentOf = (isTarget: boolean): ReportSegment =>
  isTarget ? 'target' : 'nontarget'

function emptyReport(
  departmentId: string,
  year: number,
  lastYear: number,
): TargetClientsReport {
  const emptySegment: ReportSegmentData = {
    rows: [],
    byManager: [],
    totals: {
      lastYearFact: 0,
      plan: 0,
      forecast: 0,
      factYtd: 0,
      clientCount: 0,
      avgCheckLastYear: null,
    },
  }
  return {
    year,
    lastYear,
    departmentId,
    managers: [],
    target: { ...emptySegment },
    nontarget: { ...emptySegment },
    combined: {
      byManager: [],
      totals: { plan: 0, forecast: 0, factYtd: 0, newTarget: 0 },
    },
  }
}

// ---------------------------------------------------------------------------
// Target clients report — план / прогноз / факт по менеджерам
// (reproduces the «ГКС» sheet: ЦЕЛЕВЫЕ / НЕЦЕЛЕВЫЕ / ОБЩИЕ + «Цель НОВЫЕ»)
// ---------------------------------------------------------------------------

export const fetchTargetClientsReport = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      departmentId: z.string(),
      year: z.number().int().min(2000).max(2100).optional(),
    }),
  )
  .handler(async ({ data }): Promise<TargetClientsReport> => {
    const year = data.year ?? new Date().getFullYear()
    const lastYear = year - 1

    const accessibleIds = await getAccessibleDepartmentIds()
    if (!accessibleIds.includes(data.departmentId)) {
      return emptyReport(data.departmentId, year, lastYear)
    }

    const accounts = await db.query.companyAccount.findMany({
      where: and(
        eq(companyAccount.accountType, 'client'),
        eq(companyAccount.businessUnitId, data.departmentId),
      ),
      with: {
        company: { columns: { id: true, name: true } },
        managers: { with: { user: { columns: { id: true, name: true } } } },
      },
    })

    const accountIds = accounts.map((a) => a.id)
    const hasAccounts = accountIds.length > 0

    const factWindow = (from: number, to: number) =>
      and(
        eq(companyAccount.businessUnitId, data.departmentId),
        eq(companyAccount.accountType, 'client'),
        gte(grossProfitFact.factDate, `${from}-01-01`),
        lt(grossProfitFact.factDate, `${to}-01-01`),
        isNull(grossProfitFact.deletedAt),
      )

    const clientMgrWindow = (from: number, to: number) =>
      and(
        inArray(grossProfitFact.companyAccountId, accountIds),
        gte(grossProfitFact.factDate, `${from}-01-01`),
        lt(grossProfitFact.factDate, `${to}-01-01`),
        isNull(grossProfitFact.deletedAt),
      )

    const [
      lastYearFactByMgr,
      ytdFactByMgr,
      lastYearFactByAccount,
      ytdFactByAccount,
      targetForecastRows,
      planRows,
      clientMgrLastYearRows,
      clientMgrYtdRows,
    ] = await Promise.all([
      // Per-manager actual gross profit, last year, split by segment
      hasAccounts
        ? db
            .select({
              managerId: grossProfitFact.managerUserId,
              isTarget: companyAccount.isTarget,
              value: sql<string | null>`sum(${grossProfitFact.amount})`,
            })
            .from(grossProfitFact)
            .innerJoin(
              companyAccount,
              eq(grossProfitFact.companyAccountId, companyAccount.id),
            )
            .where(factWindow(lastYear, year))
            .groupBy(grossProfitFact.managerUserId, companyAccount.isTarget)
        : Promise.resolve([]),
      // Per-manager actual gross profit, this year (YTD), split by segment
      hasAccounts
        ? db
            .select({
              managerId: grossProfitFact.managerUserId,
              isTarget: companyAccount.isTarget,
              value: sql<string | null>`sum(${grossProfitFact.amount})`,
            })
            .from(grossProfitFact)
            .innerJoin(
              companyAccount,
              eq(grossProfitFact.companyAccountId, companyAccount.id),
            )
            .where(factWindow(year, year + 1))
            .groupBy(grossProfitFact.managerUserId, companyAccount.isTarget)
        : Promise.resolve([]),
      // Per-account actual gross profit, last year
      hasAccounts
        ? db
            .select({
              accountId: grossProfitFact.companyAccountId,
              value: sql<string | null>`sum(${grossProfitFact.amount})`,
            })
            .from(grossProfitFact)
            .where(
              and(
                inArray(grossProfitFact.companyAccountId, accountIds),
                gte(grossProfitFact.factDate, `${lastYear}-01-01`),
                lt(grossProfitFact.factDate, `${year}-01-01`),
                isNull(grossProfitFact.deletedAt),
              ),
            )
            .groupBy(grossProfitFact.companyAccountId)
        : Promise.resolve([]),
      // Per-account actual gross profit, this year (YTD)
      hasAccounts
        ? db
            .select({
              accountId: grossProfitFact.companyAccountId,
              value: sql<string | null>`sum(${grossProfitFact.amount})`,
            })
            .from(grossProfitFact)
            .where(
              and(
                inArray(grossProfitFact.companyAccountId, accountIds),
                gte(grossProfitFact.factDate, `${year}-01-01`),
                lt(grossProfitFact.factDate, `${year + 1}-01-01`),
                isNull(grossProfitFact.deletedAt),
              ),
            )
            .groupBy(grossProfitFact.companyAccountId)
        : Promise.resolve([]),
      // Per-account forecast (account-level total)
      hasAccounts
        ? db
            .select({
              accountId: accountTargetForecast.companyAccountId,
              value: accountTargetForecast.value,
            })
            .from(accountTargetForecast)
            .where(
              and(
                inArray(accountTargetForecast.companyAccountId, accountIds),
                eq(accountTargetForecast.year, year),
              ),
            )
        : Promise.resolve([]),
      // Top-down plan for this business unit + year
      db
        .select({
          userId: salesPlan.userId,
          userName: user.name,
          segment: salesPlan.segment,
          value: salesPlan.value,
        })
        .from(salesPlan)
        .innerJoin(user, eq(salesPlan.userId, user.id))
        .where(
          and(
            eq(salesPlan.departmentId, data.departmentId),
            eq(salesPlan.year, year),
          ),
        ),
      // Per-account × per-manager actual gross profit, last year
      hasAccounts
        ? db
            .select({
              accountId: grossProfitFact.companyAccountId,
              managerId: grossProfitFact.managerUserId,
              value: sql<string | null>`sum(${grossProfitFact.amount})`,
            })
            .from(grossProfitFact)
            .where(clientMgrWindow(lastYear, year))
            .groupBy(
              grossProfitFact.companyAccountId,
              grossProfitFact.managerUserId,
            )
        : Promise.resolve([]),
      // Per-account × per-manager actual gross profit, this year (YTD)
      hasAccounts
        ? db
            .select({
              accountId: grossProfitFact.companyAccountId,
              managerId: grossProfitFact.managerUserId,
              value: sql<string | null>`sum(${grossProfitFact.amount})`,
            })
            .from(grossProfitFact)
            .where(clientMgrWindow(year, year + 1))
            .groupBy(
              grossProfitFact.companyAccountId,
              grossProfitFact.managerUserId,
            )
        : Promise.resolve([]),
    ])

    // ----- Manager registry (id → name) --------------------------------------
    const managerNames = new Map<string, string>()
    for (const a of accounts) {
      for (const m of a.managers) managerNames.set(m.user.id, m.user.name)
    }
    for (const p of planRows) managerNames.set(p.userId, p.userName)

    const referencedIds = new Set<string>([
      ...lastYearFactByMgr.map((r) => r.managerId),
      ...ytdFactByMgr.map((r) => r.managerId),
    ])
    const missingIds = [...referencedIds].filter((id) => !managerNames.has(id))
    if (missingIds.length > 0) {
      const extra = await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(inArray(user.id, missingIds))
      for (const u of extra) managerNames.set(u.id, u.name)
    }

    // ----- Keyed aggregation maps (key = `${managerId}|${segment}`) ----------
    const key = (managerId: string, segment: ReportSegment) =>
      `${managerId}|${segment}`

    const lastYearFactMap = new Map<string, number>()
    for (const r of lastYearFactByMgr) {
      lastYearFactMap.set(key(r.managerId, segmentOf(r.isTarget)), num(r.value))
    }
    const ytdFactMap = new Map<string, number>()
    for (const r of ytdFactByMgr) {
      ytdFactMap.set(key(r.managerId, segmentOf(r.isTarget)), num(r.value))
    }
    const planMap = new Map<string, number>()
    for (const r of planRows) {
      planMap.set(key(r.userId, r.segment as ReportSegment), num(r.value))
    }

    // ----- Forecast: per-account total auto-distributed across managers ------
    // The forecast (accountTargetForecast) is stored per account. We spread it
    // evenly across the account's managers; if an account has no managers it
    // still counts toward the segment total but lands in «unassigned».
    const targetForecastByAccount = new Map<string, number>()
    for (const r of targetForecastRows) {
      targetForecastByAccount.set(r.accountId, num(r.value))
    }

    const forecastMap = new Map<string, number>()
    const unassignedForecast: Record<ReportSegment, number> = {
      target: 0,
      nontarget: 0,
    }
    const addForecast = (
      managerId: string,
      segment: ReportSegment,
      value: number,
    ) => {
      forecastMap.set(
        key(managerId, segment),
        (forecastMap.get(key(managerId, segment)) ?? 0) + value,
      )
    }
    for (const a of accounts) {
      const segment = segmentOf(a.isTarget)
      const total = targetForecastByAccount.get(a.id) ?? 0
      if (total === 0) continue
      const mgrIds = a.managers.map((m) => m.user.id)
      if (mgrIds.length === 0) {
        unassignedForecast[segment] += total
        continue
      }
      const share = total / mgrIds.length
      for (const uid of mgrIds) addForecast(uid, segment, share)
    }

    // ----- Ordered manager list ----------------------------------------------
    const managers: ReportManager[] = [...managerNames.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))

    // ----- Per-account fact / forecast lookups for table rows ----------------
    const acctLastYear = new Map(
      lastYearFactByAccount.map((r) => [r.accountId, num(r.value)]),
    )
    const acctYtd = new Map(
      ytdFactByAccount.map((r) => [r.accountId, num(r.value)]),
    )

    // account → manager → ВП (for the client × manager matrix)
    const nestByAccountManager = (
      rows: Array<{
        accountId: string
        managerId: string
        value: string | null
      }>,
    ) => {
      const map = new Map<string, Map<string, number>>()
      for (const r of rows) {
        const inner = map.get(r.accountId) ?? new Map<string, number>()
        inner.set(r.managerId, num(r.value))
        map.set(r.accountId, inner)
      }
      return map
    }
    const clientMgrLastYear = nestByAccountManager(clientMgrLastYearRows)
    const clientMgrYtd = nestByAccountManager(clientMgrYtdRows)

    // ----- Build a segment (rows + per-manager cells + totals) ---------------
    const buildSegment = (segment: ReportSegment): ReportSegmentData => {
      const segAccounts = accounts.filter(
        (a) => segmentOf(a.isTarget) === segment,
      )

      const rows: TargetClientReportRow[] = segAccounts
        .map((a) => {
          const lastYearByMgr = clientMgrLastYear.get(a.id)
          const ytdByMgr = clientMgrYtd.get(a.id)
          const byManager: Record<string, ClientManagerFact> = {}
          for (const m of managers) {
            const ly = lastYearByMgr?.get(m.id) ?? 0
            const ytd = ytdByMgr?.get(m.id) ?? 0
            if (ly !== 0 || ytd !== 0) {
              byManager[m.id] = { lastYearFact: ly, factYtd: ytd }
            }
          }
          return {
            accountId: a.id,
            companyId: a.company.id,
            name: a.company.name,
            managers: a.managers.map((m) => m.user.name),
            gpLastYear: acctLastYear.has(a.id) ? acctLastYear.get(a.id)! : null,
            forecast: targetForecastByAccount.has(a.id)
              ? targetForecastByAccount.get(a.id)!
              : null,
            factYtd: acctYtd.has(a.id) ? acctYtd.get(a.id)! : null,
            byManager,
          }
        })
        .sort((a, b) => (b.gpLastYear ?? 0) - (a.gpLastYear ?? 0))

      const byManager: SegmentManagerCell[] = managers.map((m) => ({
        managerId: m.id,
        lastYearFact: lastYearFactMap.get(key(m.id, segment)) ?? 0,
        plan: planMap.get(key(m.id, segment)) ?? 0,
        forecast: forecastMap.get(key(m.id, segment)) ?? 0,
        factYtd: ytdFactMap.get(key(m.id, segment)) ?? 0,
      }))

      const sum = (pick: (c: SegmentManagerCell) => number) =>
        byManager.reduce((acc, c) => acc + pick(c), 0)

      const lastYearFact = sum((c) => c.lastYearFact)
      const clientCount = segAccounts.length
      return {
        rows,
        byManager,
        totals: {
          lastYearFact,
          plan: sum((c) => c.plan),
          forecast: sum((c) => c.forecast) + unassignedForecast[segment],
          factYtd: sum((c) => c.factYtd),
          clientCount,
          avgCheckLastYear: clientCount > 0 ? lastYearFact / clientCount : null,
        },
      }
    }

    const target = buildSegment('target')
    const nontarget = buildSegment('nontarget')

    // ----- Combined (target + nontarget) per manager + «Цель НОВЫЕ» ----------
    const targetByMgr = new Map(target.byManager.map((c) => [c.managerId, c]))
    const nontargetByMgr = new Map(
      nontarget.byManager.map((c) => [c.managerId, c]),
    )
    const combinedByManager: CombinedManagerCell[] = managers.map((m) => {
      const t = targetByMgr.get(m.id)
      const n = nontargetByMgr.get(m.id)
      const plan = (t?.plan ?? 0) + (n?.plan ?? 0)
      const forecast = (t?.forecast ?? 0) + (n?.forecast ?? 0)
      const factYtd = (t?.factYtd ?? 0) + (n?.factYtd ?? 0)
      return {
        managerId: m.id,
        plan,
        forecast,
        factYtd,
        newTarget: plan - forecast,
      }
    })
    const combinedTotals = {
      plan: target.totals.plan + nontarget.totals.plan,
      forecast: target.totals.forecast + nontarget.totals.forecast,
      factYtd: target.totals.factYtd + nontarget.totals.factYtd,
      newTarget: 0,
    }
    combinedTotals.newTarget = combinedTotals.plan - combinedTotals.forecast

    return {
      year,
      lastYear,
      departmentId: data.departmentId,
      managers,
      target,
      nontarget,
      combined: { byManager: combinedByManager, totals: combinedTotals },
    }
  })

// ---------------------------------------------------------------------------
// Sales plan CRUD («Планы продаж»)
// ---------------------------------------------------------------------------

const salesPlanSchema = z.object({
  departmentId: z.string().min(1, 'Выберите подразделение'),
  userId: z.string().min(1, 'Выберите менеджера'),
  year: z.number().int().min(2000).max(2100),
  segment: z.enum(['target', 'nontarget']),
  value: z.string().min(1, 'Укажите план'),
})

async function assertAccessibleDepartment(departmentId: string) {
  const accessibleIds = await getAccessibleDepartmentIds()
  if (!accessibleIds.includes(departmentId)) {
    throw new Error('Нет доступа к этому подразделению')
  }
  const dept = await db.query.department.findFirst({
    where: eq(department.id, departmentId),
    columns: { departmentType: true },
  })
  if (!dept || dept.departmentType !== 'sales') {
    throw new Error('Планы можно задавать только для продающих подразделений')
  }
}

export const fetchSalesPlans = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({ year: z.number().int().min(2000).max(2100).optional() }),
  )
  .handler(async ({ data }): Promise<SalesPlanRow[]> => {
    const accessibleIds = await getAccessibleDepartmentIds()
    if (accessibleIds.length === 0) return []

    const rows = await db
      .select({
        id: salesPlan.id,
        departmentId: salesPlan.departmentId,
        departmentName: department.name,
        userId: salesPlan.userId,
        userName: user.name,
        year: salesPlan.year,
        segment: salesPlan.segment,
        value: salesPlan.value,
      })
      .from(salesPlan)
      .innerJoin(department, eq(salesPlan.departmentId, department.id))
      .innerJoin(user, eq(salesPlan.userId, user.id))
      .where(
        and(
          inArray(salesPlan.departmentId, accessibleIds),
          data.year ? eq(salesPlan.year, data.year) : undefined,
        ),
      )
      .orderBy(department.name, user.name)

    return rows.map((r) => ({
      ...r,
      segment: r.segment as ReportSegment,
    }))
  })

export const addSalesPlan = createServerFn({ method: 'POST' })
  .inputValidator(salesPlanSchema)
  .handler(async ({ data }) => {
    await assertAccessibleDepartment(data.departmentId)

    const existing = await db
      .select({ id: salesPlan.id })
      .from(salesPlan)
      .where(
        and(
          eq(salesPlan.departmentId, data.departmentId),
          eq(salesPlan.userId, data.userId),
          eq(salesPlan.year, data.year),
          eq(salesPlan.segment, data.segment),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      throw new Error(
        'План для этого менеджера, года и сегмента уже существует',
      )
    }

    await db.insert(salesPlan).values({
      departmentId: data.departmentId,
      userId: data.userId,
      year: data.year,
      segment: data.segment,
      value: data.value,
    })
  })

export const updateSalesPlan = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string(), value: z.string().min(1) }))
  .handler(async ({ data }) => {
    const existing = await db.query.salesPlan.findFirst({
      where: eq(salesPlan.id, data.id),
      columns: { departmentId: true },
    })
    if (!existing) throw new Error('План не найден')
    await assertAccessibleDepartment(existing.departmentId)

    await db
      .update(salesPlan)
      .set({ value: data.value })
      .where(eq(salesPlan.id, data.id))
  })

export const deleteSalesPlan = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const existing = await db.query.salesPlan.findFirst({
      where: eq(salesPlan.id, data.id),
      columns: { departmentId: true },
    })
    if (!existing) return
    await assertAccessibleDepartment(existing.departmentId)
    await db.delete(salesPlan).where(eq(salesPlan.id, data.id))
  })

// Sales departments the current user can plan for
export const fetchSalesPlanDepartments = createServerFn({
  method: 'GET',
}).handler(async () => {
  const accessibleIds = await getAccessibleDepartmentIds()
  if (accessibleIds.length === 0) return []
  return db
    .select({ id: department.id, name: department.name })
    .from(department)
    .where(
      and(
        inArray(department.id, accessibleIds),
        eq(department.departmentType, 'sales'),
      ),
    )
    .orderBy(department.name)
})

// Managers (non-plain users) of a given department — for the plan form
export const fetchDepartmentManagers = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ departmentId: z.string() }))
  .handler(async ({ data }) => {
    return db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(eq(user.departmentId, data.departmentId))
      .orderBy(user.name)
  })
