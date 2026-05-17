import { createServerFn } from '@tanstack/react-start'
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  or,
} from 'drizzle-orm'
import { getRequest } from '@tanstack/react-start/server'
import * as z from 'zod'
import { db } from '@/db'
import {
  targetAction,
  targetActionType,
  department,
  user,
  proposal,
} from '@/db/schema'
import { auth } from 'utils/auth'
import type { TargetActionRow, TargetActionTypeRow } from '@/types'

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
      createdAt: targetActionType.createdAt,
    })
    .from(targetActionType)
    .where(isNull(targetActionType.deletedAt))
    .orderBy(asc(targetActionType.name))
  return rows
})
