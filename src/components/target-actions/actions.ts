import { createServerFn } from '@tanstack/react-start'
import { and, eq, gte, isNull, lte } from 'drizzle-orm'
import { getRequest } from '@tanstack/react-start/server'
import * as z from 'zod'
import { db } from '@/db'
import { targetAction, targetActionType, department, user } from '@/db/schema'
import { auth } from 'utils/auth'
import type { TargetActionRow } from '@/types'

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
      .select({
        id: targetAction.id,
        typeName: targetActionType.name,
        typeSlug: targetActionType.slug,
        responsibleUserId: targetAction.responsibleUserId,
        responsibleUserName: user.name,
        departmentId: targetAction.departmentId,
        departmentName: department.name,
        plannedAt: targetAction.plannedAt,
        completedAt: targetAction.completedAt,
        status: targetAction.status,
        sourceType: targetAction.sourceType,
        sourceId: targetAction.sourceId,
        createdAt: targetAction.createdAt,
      })
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

    return rows.map((r) => ({
      id: r.id,
      typeName: r.typeName ?? '',
      typeSlug: r.typeSlug ?? '',
      responsibleUserId: r.responsibleUserId,
      responsibleUserName: r.responsibleUserName ?? null,
      departmentId: r.departmentId,
      departmentName: r.departmentName ?? null,
      plannedAt: r.plannedAt,
      completedAt: r.completedAt,
      status: r.status as TargetActionRow['status'],
      sourceType: r.sourceType,
      sourceId: r.sourceId,
      createdAt: r.createdAt,
    }))
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
      .select({
        id: targetAction.id,
        typeName: targetActionType.name,
        typeSlug: targetActionType.slug,
        responsibleUserId: targetAction.responsibleUserId,
        responsibleUserName: user.name,
        departmentId: targetAction.departmentId,
        departmentName: department.name,
        plannedAt: targetAction.plannedAt,
        completedAt: targetAction.completedAt,
        status: targetAction.status,
        sourceType: targetAction.sourceType,
        sourceId: targetAction.sourceId,
        createdAt: targetAction.createdAt,
      })
      .from(targetAction)
      .leftJoin(targetActionType, eq(targetAction.typeId, targetActionType.id))
      .leftJoin(user, eq(targetAction.responsibleUserId, user.id))
      .leftJoin(department, eq(targetAction.departmentId, department.id))
      .where(and(...conditions))

    return rows.map((r) => ({
      id: r.id,
      typeName: r.typeName ?? '',
      typeSlug: r.typeSlug ?? '',
      responsibleUserId: r.responsibleUserId,
      responsibleUserName: r.responsibleUserName ?? null,
      departmentId: r.departmentId,
      departmentName: r.departmentName ?? null,
      plannedAt: r.plannedAt,
      completedAt: r.completedAt,
      status: r.status as TargetActionRow['status'],
      sourceType: r.sourceType,
      sourceId: r.sourceId,
      createdAt: r.createdAt,
    }))
  })
