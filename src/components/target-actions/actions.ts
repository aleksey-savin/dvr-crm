import { createServerFn } from '@tanstack/react-start'
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  or,
  sum,
} from 'drizzle-orm'
import { getRequest } from '@tanstack/react-start/server'
import * as z from 'zod'
import { db } from '@/db'
import {
  targetAction,
  targetActionType,
  targetActionPlan,
  department,
  user,
  proposal,
  initiative,
  companyAccount,
  companyAccountManagers,
  company,
  meeting,
  meetingParticipant,
  meetingExternalParticipant,
} from '@/db/schema'
import { auth } from 'utils/auth'
import {
  buildDepartmentScopeFilter,
  getAccessibleDepartmentIds,
  getServerSession,
} from '@/lib/department-scope'
import type {
  ManagerActionDetail,
  ManagerCompletedAction,
  ManagerReportDetail,
  TargetActionAnalytics,
  TargetActionAnalyticsRow,
  TargetActionAnalyticsType,
  TargetActionDashboard,
  TargetActionManagerSummary,
  TargetActionPeriod,
  TargetActionPlanRow,
  TargetActionReport,
  TargetActionRow,
  TargetActionTypeCell,
  TargetActionTypeRow,
} from '@/types'

async function getCurrentUserWithDeptId() {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return null
  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { id: true, role: true, departmentId: true },
  })
  return dbUser ?? null
}

const TARGET_ACTION_SELECT = {
  id: targetAction.id,
  typeId: targetAction.typeId,
  typeName: targetActionType.name,
  typeSlug: targetActionType.slug,
  responsibleUserId: targetAction.responsibleUserId,
  responsibleUserName: user.name,
  departmentId: targetAction.departmentId,
  departmentName: department.name,
  plannedAt: targetAction.plannedAt,
  completedAt: targetAction.completedAt,
  status: targetAction.status,
  result: targetAction.result,
  reason: targetAction.reason,
  sourceType: targetAction.sourceType,
  sourceId: targetAction.sourceId,
  initiativeId: targetAction.initiativeId,
  proposalId: targetAction.proposalId,
  createdAt: targetAction.createdAt,
} as const

type RawRow = {
  id: string
  typeId: string
  typeName: string | null
  typeSlug: string | null
  responsibleUserId: string | null
  responsibleUserName: string | null
  departmentId: string | null
  departmentName: string | null
  plannedAt: string
  completedAt: Date | null
  status: string
  result: string | null
  reason: string | null
  sourceType: string
  sourceId: string | null
  initiativeId: string | null
  proposalId: string | null
  createdAt: Date
}

function mapRow(r: RawRow): TargetActionRow {
  return {
    id: r.id,
    typeId: r.typeId,
    typeName: r.typeName ?? '',
    typeSlug: r.typeSlug ?? '',
    responsibleUserId: r.responsibleUserId,
    responsibleUserName: r.responsibleUserName ?? null,
    departmentId: r.departmentId,
    departmentName: r.departmentName ?? null,
    plannedAt: r.plannedAt,
    completedAt: r.completedAt,
    status: r.status as TargetActionRow['status'],
    result: r.result,
    reason: r.reason,
    sourceType: r.sourceType as TargetActionRow['sourceType'],
    sourceId: r.sourceId,
    initiativeId: r.initiativeId,
    proposalId: r.proposalId,
    createdAt: r.createdAt,
  }
}

export const fetchMyTargetActions = createServerFn()
  .inputValidator(
    z
      .object({
        month: z.number().min(1).max(12).optional(),
        year: z.number().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }): Promise<TargetActionRow[]> => {
    const currentUser = await getCurrentUserWithDeptId()
    if (!currentUser) throw new Error('Не авторизован')

    const now = new Date()
    const month = data?.month ?? now.getMonth() + 1
    const year = data?.year ?? now.getFullYear()

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0)
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

    const rows = await db
      .select(TARGET_ACTION_SELECT)
      .from(targetAction)
      .leftJoin(targetActionType, eq(targetAction.typeId, targetActionType.id))
      .leftJoin(user, eq(targetAction.responsibleUserId, user.id))
      .leftJoin(department, eq(targetAction.departmentId, department.id))
      .where(
        and(
          isNull(targetAction.deletedAt),
          eq(targetAction.responsibleUserId, currentUser.id),
          gte(targetAction.plannedAt, startDate),
          lte(targetAction.plannedAt, endDateStr),
        ),
      )

    return rows.map(mapRow)
  })

export const fetchTargetActions = createServerFn()
  .inputValidator(
    z
      .object({
        departmentId: z.string().optional(),
        userId: z.string().optional(),
        month: z.number().min(1).max(12).optional(),
        year: z.number().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }): Promise<TargetActionRow[]> => {
    const now = new Date()
    const month = data?.month ?? now.getMonth() + 1
    const year = data?.year ?? now.getFullYear()

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDay = new Date(year, month, 0).getDate()
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`

    const conditions = [
      isNull(targetAction.deletedAt),
      gte(targetAction.plannedAt, startDate),
      lte(targetAction.plannedAt, endDateStr),
    ]
    // Restrict to departments the caller may see (admins bypass).
    const scope = await buildDepartmentScopeFilter(targetAction.departmentId)
    if (scope) conditions.push(scope)
    if (data?.departmentId) {
      conditions.push(eq(targetAction.departmentId, data.departmentId))
    }
    if (data?.userId) {
      conditions.push(eq(targetAction.responsibleUserId, data.userId))
    }

    const rows = await db
      .select(TARGET_ACTION_SELECT)
      .from(targetAction)
      .leftJoin(targetActionType, eq(targetAction.typeId, targetActionType.id))
      .leftJoin(user, eq(targetAction.responsibleUserId, user.id))
      .leftJoin(department, eq(targetAction.departmentId, department.id))
      .where(and(...conditions))

    return rows.map(mapRow)
  })

/**
 * Returns all target actions linked to an initiative — either directly via
 * targetAction.initiativeId, or indirectly via a proposal that belongs to the
 * initiative. Sorted by completedAt DESC (most recent fact first); falls back
 * to plannedAt for rows without completion.
 */
export const fetchActionsByInitiative = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ initiativeId: z.string() }))
  .handler(async ({ data }): Promise<TargetActionRow[]> => {
    // Only expose actions of an initiative the caller may access.
    const initiativeRow = await db.query.initiative.findFirst({
      where: eq(initiative.id, data.initiativeId),
      columns: { departmentId: true },
    })
    if (!initiativeRow) return []
    const session = await getServerSession()
    if (session?.user.role !== 'admin' && initiativeRow.departmentId) {
      const accessible = await getAccessibleDepartmentIds()
      if (!accessible.includes(initiativeRow.departmentId)) return []
    }

    const proposals = await db
      .select({ id: proposal.id })
      .from(proposal)
      .where(eq(proposal.initiativeId, data.initiativeId))
    const proposalIds = proposals.map((p) => p.id)

    const linkCondition =
      proposalIds.length > 0
        ? or(
            eq(targetAction.initiativeId, data.initiativeId),
            inArray(targetAction.proposalId, proposalIds),
          )
        : eq(targetAction.initiativeId, data.initiativeId)

    const rows = await db
      .select(TARGET_ACTION_SELECT)
      .from(targetAction)
      .leftJoin(targetActionType, eq(targetAction.typeId, targetActionType.id))
      .leftJoin(user, eq(targetAction.responsibleUserId, user.id))
      .leftJoin(department, eq(targetAction.departmentId, department.id))
      .where(and(isNull(targetAction.deletedAt), linkCondition))
      .orderBy(desc(targetAction.completedAt), desc(targetAction.plannedAt))

    return rows.map(mapRow)
  })

export const fetchTargetActionTypes = createServerFn({
  method: 'GET',
}).handler(async (): Promise<TargetActionTypeRow[]> => {
  const rows = await db
    .select({
      id: targetActionType.id,
      name: targetActionType.name,
      slug: targetActionType.slug,
      isSystem: targetActionType.isSystem,
      isPlannable: targetActionType.isPlannable,
      createdAt: targetActionType.createdAt,
    })
    .from(targetActionType)
    .where(isNull(targetActionType.deletedAt))
    .orderBy(asc(targetActionType.name))
  return rows
})

// ---------------------------------------------------------------------------
// KPI: plan / fact report, plan editing, approval, dashboard
// ---------------------------------------------------------------------------

function monthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const endDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
  return { start, end }
}

type ManagerRow = {
  id: string
  name: string
  departmentId: string | null
  departmentName: string | null
}

type ViewerContext = {
  userId: string
  role: string
  departmentId: string | null
  /** Head of a department or admin — may manage and approve others' plans. */
  isManager: boolean
  accessibleDeptIds: string[]
}

async function getViewerContext(): Promise<ViewerContext | null> {
  const session = await getServerSession()
  if (!session?.user) return null
  const me = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { id: true, role: true, departmentId: true },
  })
  if (!me) return null

  const accessibleDeptIds = await getAccessibleDepartmentIds()
  let isManager = me.role === 'admin'
  if (!isManager) {
    const headed = await db
      .select({ id: department.id })
      .from(department)
      .where(eq(department.headUserId, me.id))
      .limit(1)
    isManager = headed.length > 0
  }
  return {
    userId: me.id,
    role: me.role,
    departmentId: me.departmentId,
    isManager,
    accessibleDeptIds,
  }
}

/** Plannable types only (isPlannable=true) — for plan-setting / dashboard. */
async function loadPlannableTypes() {
  const rows = await db
    .select({
      id: targetActionType.id,
      name: targetActionType.name,
      isPlannable: targetActionType.isPlannable,
    })
    .from(targetActionType)
    .where(isNull(targetActionType.deletedAt))
    .orderBy(asc(targetActionType.name))
  return rows.filter((t) => t.isPlannable)
}

/** All non-deleted types with their plannable flag — for the analytics report.
 *  Plannable first, then fact-only; both ordered by name. */
async function loadReportTypes(): Promise<TargetActionAnalyticsType[]> {
  return db
    .select({
      id: targetActionType.id,
      name: targetActionType.name,
      isPlannable: targetActionType.isPlannable,
    })
    .from(targetActionType)
    .where(isNull(targetActionType.deletedAt))
    .orderBy(desc(targetActionType.isPlannable), asc(targetActionType.name))
}

const MANAGER_SELECT = {
  id: user.id,
  name: user.name,
  departmentId: user.departmentId,
  departmentName: department.name,
} as const

/** Managers in scope: self for a regular user, accessible-dept members for a head/admin. */
async function loadManagers(
  ctx: ViewerContext,
  departmentIdFilter?: string,
): Promise<ManagerRow[]> {
  if (!ctx.isManager) {
    return db
      .select(MANAGER_SELECT)
      .from(user)
      .leftJoin(department, eq(user.departmentId, department.id))
      .where(eq(user.id, ctx.userId))
  }

  let deptIds = ctx.accessibleDeptIds
  if (departmentIdFilter) {
    deptIds =
      ctx.role === 'admin' || ctx.accessibleDeptIds.includes(departmentIdFilter)
        ? [departmentIdFilter]
        : []
  }
  if (deptIds.length === 0) return []

  return db
    .select(MANAGER_SELECT)
    .from(user)
    .leftJoin(department, eq(user.departmentId, department.id))
    .where(inArray(user.departmentId, deptIds))
    .orderBy(asc(user.name))
}

/** Builds plan/fact rows for the given managers × plannable types for a month. */
async function computePlanRows(
  managers: ManagerRow[],
  year: number,
  month: number,
): Promise<TargetActionPlanRow[]> {
  if (managers.length === 0) return []
  const types = await loadPlannableTypes()
  if (types.length === 0) return []

  const managerIds = managers.map((m) => m.id)
  const typeIds = types.map((t) => t.id)
  const { start, end } = monthRange(year, month)

  const plans = await db
    .select({
      id: targetActionPlan.id,
      userId: targetActionPlan.userId,
      typeId: targetActionPlan.typeId,
      plannedCount: targetActionPlan.plannedCount,
      status: targetActionPlan.status,
    })
    .from(targetActionPlan)
    .where(
      and(
        eq(targetActionPlan.year, year),
        eq(targetActionPlan.month, month),
        inArray(targetActionPlan.userId, managerIds),
      ),
    )
  const planMap = new Map(plans.map((p) => [`${p.userId}:${p.typeId}`, p]))

  const facts = await db
    .select({
      userId: targetAction.responsibleUserId,
      typeId: targetAction.typeId,
      value: count(),
    })
    .from(targetAction)
    .where(
      and(
        isNull(targetAction.deletedAt),
        eq(targetAction.status, 'completed'),
        gte(targetAction.plannedAt, start),
        lte(targetAction.plannedAt, end),
        inArray(targetAction.responsibleUserId, managerIds),
        inArray(targetAction.typeId, typeIds),
      ),
    )
    .groupBy(targetAction.responsibleUserId, targetAction.typeId)
  const factMap = new Map(
    facts.map((f) => [`${f.userId}:${f.typeId}`, Number(f.value)]),
  )

  const rows: TargetActionPlanRow[] = []
  for (const m of managers) {
    for (const t of types) {
      const key = `${m.id}:${t.id}`
      const plan = planMap.get(key)
      rows.push({
        userId: m.id,
        userName: m.name,
        departmentId: m.departmentId,
        departmentName: m.departmentName,
        typeId: t.id,
        typeName: t.name,
        planId: plan?.id ?? null,
        plannedCount: plan?.plannedCount ?? 0,
        factCount: factMap.get(key) ?? 0,
        status: plan?.status ?? 'pending',
      })
    }
  }
  return rows
}

export const fetchPlannableTargetActionTypes = createServerFn({
  method: 'GET',
}).handler(async (): Promise<TargetActionTypeRow[]> => {
  const rows = await db
    .select({
      id: targetActionType.id,
      name: targetActionType.name,
      slug: targetActionType.slug,
      isSystem: targetActionType.isSystem,
      isPlannable: targetActionType.isPlannable,
      createdAt: targetActionType.createdAt,
    })
    .from(targetActionType)
    .where(isNull(targetActionType.deletedAt))
    .orderBy(asc(targetActionType.name))
  return rows.filter((t) => t.isPlannable)
})

export const fetchTargetActionReport = createServerFn()
  .inputValidator(
    z.object({
      departmentId: z.string().optional(),
      month: z.number().min(1).max(12),
      year: z.number(),
    }),
  )
  .handler(async ({ data }): Promise<TargetActionReport> => {
    const ctx = await getViewerContext()
    if (!ctx) throw new Error('Не авторизован')

    const managers = await loadManagers(ctx, data.departmentId)
    const rows = await computePlanRows(managers, data.year, data.month)
    return {
      year: data.year,
      month: data.month,
      rows,
      canManageOthers: ctx.isManager,
    }
  })

export const upsertTargetActionPlan = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      userId: z.string(),
      typeId: z.string(),
      year: z.number(),
      month: z.number().min(1).max(12),
      plannedCount: z.number().int().min(0),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await getViewerContext()
    if (!ctx) throw new Error('Не авторизован')

    const type = (
      await db
        .select({ isPlannable: targetActionType.isPlannable })
        .from(targetActionType)
        .where(eq(targetActionType.id, data.typeId))
        .limit(1)
    ).at(0)
    if (!type) throw new Error('Тип целевого действия не найден')
    if (!type.isPlannable) {
      throw new Error('По этому типу план не выставляется')
    }

    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, data.userId),
      columns: { id: true, departmentId: true },
    })
    if (!targetUser) throw new Error('Пользователь не найден')

    const isSelf = data.userId === ctx.userId
    const canManageTarget =
      ctx.role === 'admin' ||
      (ctx.isManager &&
        !!targetUser.departmentId &&
        ctx.accessibleDeptIds.includes(targetUser.departmentId))
    if (!isSelf && !canManageTarget) {
      throw new Error('Нет прав на изменение плана этого сотрудника')
    }

    // A manager editing their own plan resets approval; a head's edits keep it.
    const resetApproval = !canManageTarget

    await db
      .insert(targetActionPlan)
      .values({
        userId: data.userId,
        departmentId: targetUser.departmentId,
        typeId: data.typeId,
        year: data.year,
        month: data.month,
        plannedCount: data.plannedCount,
        status: 'pending',
      })
      .onConflictDoUpdate({
        target: [
          targetActionPlan.userId,
          targetActionPlan.typeId,
          targetActionPlan.year,
          targetActionPlan.month,
        ],
        set: resetApproval
          ? {
              plannedCount: data.plannedCount,
              status: 'pending',
              approvedByUserId: null,
              approvedAt: null,
              updatedAt: new Date(),
            }
          : {
              plannedCount: data.plannedCount,
              departmentId: targetUser.departmentId,
              updatedAt: new Date(),
            },
      })
  })

export const setTargetActionPlanApproval = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      userId: z.string(),
      year: z.number(),
      month: z.number().min(1).max(12),
      approved: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await getViewerContext()
    if (!ctx) throw new Error('Не авторизован')

    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, data.userId),
      columns: { departmentId: true },
    })
    if (!targetUser) throw new Error('Пользователь не найден')

    const canManage =
      ctx.role === 'admin' ||
      (ctx.isManager &&
        !!targetUser.departmentId &&
        ctx.accessibleDeptIds.includes(targetUser.departmentId))
    if (!canManage) throw new Error('Нет прав на согласование плана')

    await db
      .update(targetActionPlan)
      .set(
        data.approved
          ? {
              status: 'approved',
              approvedByUserId: ctx.userId,
              approvedAt: new Date(),
            }
          : { status: 'pending', approvedByUserId: null, approvedAt: null },
      )
      .where(
        and(
          eq(targetActionPlan.userId, data.userId),
          eq(targetActionPlan.year, data.year),
          eq(targetActionPlan.month, data.month),
        ),
      )
  })

export const fetchTargetActionDashboard = createServerFn()
  .inputValidator(
    z
      .object({
        month: z.number().min(1).max(12).optional(),
        year: z.number().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }): Promise<TargetActionDashboard> => {
    const ctx = await getViewerContext()
    if (!ctx) throw new Error('Не авторизован')

    const now = new Date()
    const month = data?.month ?? now.getMonth() + 1
    const year = data?.year ?? now.getFullYear()

    const self = await db
      .select(MANAGER_SELECT)
      .from(user)
      .leftJoin(department, eq(user.departmentId, department.id))
      .where(eq(user.id, ctx.userId))
    const mine = await computePlanRows(self, year, month)

    let team: TargetActionManagerSummary[] | null = null
    if (ctx.isManager) {
      const managers = await loadManagers(ctx)
      const rows = await computePlanRows(managers, year, month)
      const byUser = new Map<string, TargetActionManagerSummary>()
      for (const r of rows) {
        const agg = byUser.get(r.userId) ?? {
          userId: r.userId,
          userName: r.userName,
          totalPlanned: 0,
          totalFact: 0,
        }
        agg.totalPlanned += r.plannedCount
        agg.totalFact += r.factCount
        byUser.set(r.userId, agg)
      }
      team = Array.from(byUser.values()).sort((a, b) =>
        a.userName.localeCompare(b.userName, 'ru'),
      )
    }

    return { month, year, mine, isHead: ctx.isManager, team }
  })

// ---------------------------------------------------------------------------
// Analytics report (/target-actions): period range, matrix, manager detail
// ---------------------------------------------------------------------------

const MONTH_LABELS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]
const QUARTER_LABELS = ['I', 'II', 'III', 'IV']

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function resolvePeriodRange(period: TargetActionPeriod): {
  start: string
  end: string
  label: string
  months: number[]
} {
  const { type, year, periodIndex } = period
  const lastDay = (month: number) => new Date(year, month, 0).getDate()

  if (type === 'month') {
    const m = periodIndex
    return {
      start: `${year}-${pad2(m)}-01`,
      end: `${year}-${pad2(m)}-${pad2(lastDay(m))}`,
      label: `${MONTH_LABELS[m - 1]} ${year}`,
      months: [m],
    }
  }
  if (type === 'quarter') {
    const first = (periodIndex - 1) * 3 + 1
    return {
      start: `${year}-${pad2(first)}-01`,
      end: `${year}-${pad2(first + 2)}-${pad2(lastDay(first + 2))}`,
      label: `${QUARTER_LABELS[periodIndex - 1]} квартал ${year}`,
      months: [first, first + 1, first + 2],
    }
  }
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    label: String(year),
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  }
}

const toPercent = (fact: number, planned: number) =>
  planned > 0 ? Math.round((fact / planned) * 100) : null

type AnalyticsResult = {
  types: TargetActionAnalyticsType[]
  rows: TargetActionAnalyticsRow[]
  totals: TargetActionAnalytics['totals']
}

/** Manager × type matrix (plan summed over the period's months, fact counted in range). */
async function computeAnalyticsRows(
  managers: ManagerRow[],
  period: TargetActionPeriod,
): Promise<AnalyticsResult> {
  const types = await loadReportTypes()
  const emptyTotals: AnalyticsResult['totals'] = {
    byType: {},
    totalPlanned: 0,
    totalFact: 0,
    overallPercent: null,
  }
  if (managers.length === 0 || types.length === 0) {
    return { types, rows: [], totals: emptyTotals }
  }

  const managerIds = managers.map((m) => m.id)
  const typeIds = types.map((t) => t.id)
  const { start, end, months } = resolvePeriodRange(period)

  const plans = await db
    .select({
      userId: targetActionPlan.userId,
      typeId: targetActionPlan.typeId,
      planned: sum(targetActionPlan.plannedCount),
    })
    .from(targetActionPlan)
    .where(
      and(
        eq(targetActionPlan.year, period.year),
        inArray(targetActionPlan.month, months),
        inArray(targetActionPlan.userId, managerIds),
      ),
    )
    .groupBy(targetActionPlan.userId, targetActionPlan.typeId)
  const planMap = new Map(
    plans.map((p) => [`${p.userId}:${p.typeId}`, Number(p.planned ?? 0)]),
  )

  const facts = await db
    .select({
      userId: targetAction.responsibleUserId,
      typeId: targetAction.typeId,
      value: count(),
    })
    .from(targetAction)
    .where(
      and(
        isNull(targetAction.deletedAt),
        eq(targetAction.status, 'completed'),
        gte(targetAction.plannedAt, start),
        lte(targetAction.plannedAt, end),
        inArray(targetAction.responsibleUserId, managerIds),
        inArray(targetAction.typeId, typeIds),
      ),
    )
    .groupBy(targetAction.responsibleUserId, targetAction.typeId)
  const factMap = new Map(
    facts.map((f) => [`${f.userId}:${f.typeId}`, Number(f.value)]),
  )

  const byType: AnalyticsResult['totals']['byType'] = {}
  for (const t of types) byType[t.id] = { planned: 0, fact: 0, percent: null }
  let grandPlanned = 0
  let grandFact = 0

  const rows: TargetActionAnalyticsRow[] = managers.map((m) => {
    const cells: Record<string, TargetActionTypeCell> = {}
    let totalPlanned = 0
    let totalFact = 0
    for (const t of types) {
      const key = `${m.id}:${t.id}`
      const planned = planMap.get(key) ?? 0
      const fact = factMap.get(key) ?? 0
      cells[t.id] = {
        typeId: t.id,
        planned,
        fact,
        percent: toPercent(fact, planned),
      }
      // Plan completion counts only types with an actual plan (planned > 0):
      // fact on unplanned types (incl. fact-only) must not inflate the overall %.
      if (planned > 0) {
        totalPlanned += planned
        totalFact += fact
      }
      byType[t.id].planned += planned
      byType[t.id].fact += fact
    }
    grandPlanned += totalPlanned
    grandFact += totalFact
    return {
      userId: m.id,
      userName: m.name,
      departmentId: m.departmentId,
      departmentName: m.departmentName,
      cells,
      totalPlanned,
      totalFact,
      overallPercent: toPercent(totalFact, totalPlanned),
    }
  })
  for (const t of types)
    byType[t.id].percent = toPercent(byType[t.id].fact, byType[t.id].planned)

  return {
    types,
    rows,
    totals: {
      byType,
      totalPlanned: grandPlanned,
      totalFact: grandFact,
      overallPercent: toPercent(grandFact, grandPlanned),
    },
  }
}

export const fetchTargetActionsAnalytics = createServerFn()
  .inputValidator(
    z.object({
      type: z.enum(['month', 'quarter', 'year']),
      year: z.number(),
      periodIndex: z.number(),
      departmentId: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<TargetActionAnalytics> => {
    const ctx = await getViewerContext()
    if (!ctx) throw new Error('Не авторизован')

    const period: TargetActionPeriod = {
      type: data.type,
      year: data.year,
      periodIndex: data.periodIndex,
    }
    const managers = await loadManagers(ctx, data.departmentId)
    const { types, rows, totals } = await computeAnalyticsRows(managers, period)
    const { start, end, label } = resolvePeriodRange(period)
    return { period, start, end, label, types, rows, totals }
  })

export const fetchManagerReportDetail = createServerFn()
  .inputValidator(
    z.object({
      userId: z.string(),
      type: z.enum(['month', 'quarter', 'year']),
      year: z.number(),
      periodIndex: z.number(),
    }),
  )
  .handler(async ({ data }): Promise<ManagerReportDetail> => {
    const ctx = await getViewerContext()
    if (!ctx) throw new Error('Не авторизован')

    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, data.userId),
      columns: {
        id: true,
        name: true,
        position: true,
        phone: true,
        email: true,
        image: true,
        departmentId: true,
      },
    })
    if (!targetUser) throw new Error('Пользователь не найден')

    const canView =
      data.userId === ctx.userId ||
      ctx.role === 'admin' ||
      (ctx.isManager &&
        !!targetUser.departmentId &&
        ctx.accessibleDeptIds.includes(targetUser.departmentId))
    if (!canView) throw new Error('Нет доступа к отчёту сотрудника')

    const deptName = targetUser.departmentId
      ? ((
          await db
            .select({ name: department.name })
            .from(department)
            .where(eq(department.id, targetUser.departmentId))
            .limit(1)
        ).at(0)?.name ?? null)
      : null

    const period: TargetActionPeriod = {
      type: data.type,
      year: data.year,
      periodIndex: data.periodIndex,
    }
    const managerRow: ManagerRow = {
      id: targetUser.id,
      name: targetUser.name,
      departmentId: targetUser.departmentId,
      departmentName: deptName,
    }
    const { types, rows } = await computeAnalyticsRows([managerRow], period)
    const summary: TargetActionAnalyticsRow = rows[0] ?? {
      userId: targetUser.id,
      userName: targetUser.name,
      departmentId: targetUser.departmentId,
      departmentName: deptName,
      cells: {},
      totalPlanned: 0,
      totalFact: 0,
      overallPercent: null,
    }

    const clients = await db
      .select({
        accountId: companyAccount.id,
        companyId: companyAccount.companyId,
        companyName: company.name,
        businessUnit: department.name,
        isTarget: companyAccount.isTarget,
        isLost: companyAccount.isLost,
      })
      .from(companyAccountManagers)
      .innerJoin(
        companyAccount,
        eq(companyAccountManagers.companyAccountId, companyAccount.id),
      )
      .innerJoin(company, eq(companyAccount.companyId, company.id))
      .leftJoin(department, eq(companyAccount.businessUnitId, department.id))
      .where(
        and(
          eq(companyAccountManagers.userId, data.userId),
          eq(companyAccount.accountType, 'client'),
        ),
      )
      .orderBy(asc(company.name))

    // Completed target actions in the period, with the context that produced each.
    const { start, end } = resolvePeriodRange(period)
    const actionRows = await db.query.targetAction.findMany({
      where: and(
        isNull(targetAction.deletedAt),
        eq(targetAction.status, 'completed'),
        eq(targetAction.responsibleUserId, data.userId),
        gte(targetAction.plannedAt, start),
        lte(targetAction.plannedAt, end),
      ),
      with: {
        type: { columns: { name: true } },
        account: { with: { company: { columns: { id: true, name: true } } } },
        initiative: {
          columns: { title: true },
          with: { company: { columns: { id: true, name: true } } },
        },
        lead: { columns: { title: true } },
        tender: { columns: { title: true } },
        signal: { columns: { title: true } },
        proposal: { columns: { title: true } },
      },
      orderBy: (ta, ops) => [ops.desc(ta.completedAt), ops.desc(ta.plannedAt)],
    })

    // Meetings are referenced by sourceId (no FK) — batch-load title/time/
    // duration/summary plus their internal + external participants.
    const meetingIds = actionRows
      .filter((row) => row.sourceType === 'meeting' && row.sourceId)
      .map((row) => row.sourceId as string)
    const meetingsById = new Map<
      string,
      {
        title: string
        scheduledAt: Date
        endedAt: Date | null
        summary: string | null
      }
    >()
    const participantsByMeeting = new Map<string, string[]>()
    if (meetingIds.length > 0) {
      const [meetingRows, internalRows, externalRows] = await Promise.all([
        db
          .select({
            id: meeting.id,
            title: meeting.title,
            scheduledAt: meeting.scheduledAt,
            endedAt: meeting.endedAt,
            summary: meeting.summary,
          })
          .from(meeting)
          .where(inArray(meeting.id, meetingIds)),
        db
          .select({
            meetingId: meetingParticipant.meetingId,
            name: user.name,
          })
          .from(meetingParticipant)
          .innerJoin(user, eq(meetingParticipant.userId, user.id))
          .where(inArray(meetingParticipant.meetingId, meetingIds)),
        db
          .select({
            meetingId: meetingExternalParticipant.meetingId,
            name: meetingExternalParticipant.name,
          })
          .from(meetingExternalParticipant)
          .where(inArray(meetingExternalParticipant.meetingId, meetingIds)),
      ])
      for (const m of meetingRows) {
        meetingsById.set(m.id, {
          title: m.title,
          scheduledAt: m.scheduledAt,
          endedAt: m.endedAt,
          summary: m.summary,
        })
      }
      for (const p of [...internalRows, ...externalRows]) {
        const list = participantsByMeeting.get(p.meetingId) ?? []
        list.push(p.name)
        participantsByMeeting.set(p.meetingId, list)
      }
    }

    const completedActions: ManagerCompletedAction[] = actionRows.map((row) => {
      const meetingId =
        row.sourceType === 'meeting' ? (row.sourceId ?? null) : null
      const linkedMeeting = meetingId
        ? (meetingsById.get(meetingId) ?? null)
        : null

      const details: ManagerActionDetail[] = []
      const clientName = row.account?.company.name ?? null
      if (clientName) {
        details.push({
          label: 'Клиент',
          value: clientName,
          companyId: row.account?.company.id ?? null,
        })
      }
      if (row.initiative?.title) {
        details.push({ label: 'Инициатива', value: row.initiative.title })
      }
      if (row.proposal?.title) {
        details.push({ label: 'КП', value: row.proposal.title })
      }
      if (row.lead?.title) {
        details.push({ label: 'Лид', value: row.lead.title })
      }
      if (row.tender?.title) {
        details.push({ label: 'Тендер', value: row.tender.title })
      }
      if (row.signal?.title) {
        details.push({ label: 'Сигнал', value: row.signal.title })
      }

      return {
        id: row.id,
        typeId: row.typeId,
        typeName: row.type.name,
        completedAt: row.completedAt ?? new Date(row.plannedAt),
        sourceType: row.sourceType,
        initiativeTitle: row.initiative?.title ?? null,
        meetingId,
        meetingTitle: linkedMeeting?.title ?? null,
        meetingAt: linkedMeeting?.scheduledAt ?? null,
        meetingDurationMin:
          linkedMeeting?.endedAt != null
            ? Math.max(
                0,
                Math.round(
                  (linkedMeeting.endedAt.getTime() -
                    linkedMeeting.scheduledAt.getTime()) /
                    60000,
                ),
              )
            : null,
        meetingSummary: linkedMeeting?.summary ?? null,
        meetingParticipants: meetingId
          ? (participantsByMeeting.get(meetingId) ?? [])
          : [],
        companyId: row.initiative?.company?.id ?? null,
        companyName: row.initiative?.company?.name ?? null,
        details,
        result: row.result,
        reason: row.reason,
      }
    })

    return {
      user: {
        id: targetUser.id,
        name: targetUser.name,
        position: targetUser.position,
        phone: targetUser.phone,
        email: targetUser.email,
        image: targetUser.image,
        departmentName: deptName,
      },
      summary,
      types,
      clients,
      completedActions,
    }
  })
