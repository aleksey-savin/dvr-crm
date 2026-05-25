import { db } from '@/db'
import {
  signal,
  entityStage,
  company,
  department,
  user,
  industry,
  signalTypeTable,
  refusalReason,
} from '@/db/schema'
import { recordQualification } from '@/components/pipeline-entity/qualification'
import type { SignalRow } from '@/types'
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { buildDepartmentScopeFilter } from '@/lib/department-scope'
import * as z from 'zod'

const signalInputSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  companyId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  responsibleUserId: z.string().nullable().optional(),
  industryId: z.string().nullable().optional(),
  signalTypeId: z.string().nullable().optional(),
  stageId: z.string().nullable().optional(),
  status: z
    .enum(['new', 'in_progress', 'converted', 'rejected'])
    .default('new'),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  description: z.string().nullable().optional(),
  lostReasonId: z.string().nullable().optional(),
})

const updateSignalSchema = signalInputSchema.extend({ id: z.string() })

const updateSignalRatingSchema = z.object({
  id: z.string(),
  rating: z.number().int().min(1).max(5).nullable(),
})

export const fetchSignals = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({ includeArchived: z.boolean().optional() }).optional(),
  )
  .handler(async ({ data }): Promise<SignalRow[]> => {
    const deptFilter = await buildDepartmentScopeFilter(signal.departmentId, {
      bypassRoles: ['admin', 'tender_specialist'],
    })

    const rows = await db
      .select({
        id: signal.id,
        title: signal.title,
        status: signal.status,
        signalTypeId: signal.signalTypeId,
        signalTypeName: signalTypeTable.name,
        stageId: signal.stageId,
        stageName: entityStage.name,
        stageColor: entityStage.color,
        stageOrder: entityStage.order,
        rating: signal.rating,
        lostReasonId: signal.lostReasonId,
        lostReasonName: refusalReason.name,
        createdAt: signal.createdAt,
        archivedAt: signal.archivedAt,
        companyId: signal.companyId,
        companyName: company.name,
        departmentId: signal.departmentId,
        departmentName: department.name,
        departmentAccentColor: department.accentColor,
        responsibleUserId: signal.responsibleUserId,
        responsibleUserName: user.name,
        industryId: signal.industryId,
        industryName: industry.name,
      })
      .from(signal)
      .leftJoin(company, eq(signal.companyId, company.id))
      .leftJoin(department, eq(signal.departmentId, department.id))
      .leftJoin(user, eq(signal.responsibleUserId, user.id))
      .leftJoin(industry, eq(signal.industryId, industry.id))
      .leftJoin(signalTypeTable, eq(signal.signalTypeId, signalTypeTable.id))
      .leftJoin(entityStage, eq(signal.stageId, entityStage.id))
      .leftJoin(refusalReason, eq(signal.lostReasonId, refusalReason.id))
      .where(
        and(
          isNull(signal.deletedAt),
          data?.includeArchived ? undefined : isNull(signal.archivedAt),
          deptFilter,
        ),
      )
      .orderBy(asc(signal.position), asc(signal.createdAt))

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status as SignalRow['status'],
      signalTypeId: row.signalTypeId,
      signalTypeName: row.signalTypeName ?? null,
      stageId: row.stageId,
      stageName: row.stageName ?? null,
      stageColor: row.stageColor ?? null,
      stageOrder: row.stageOrder ?? null,
      rating: row.rating,
      lostReasonId: row.lostReasonId,
      lostReasonName: row.lostReasonName ?? null,
      createdAt: row.createdAt,
      archivedAt: row.archivedAt,
      companyId: row.companyId,
      companyName: row.companyName ?? null,
      departmentId: row.departmentId,
      departmentName: row.departmentName ?? null,
      departmentAccentColor: row.departmentAccentColor ?? null,
      responsibleUserId: row.responsibleUserId,
      responsibleUserName: row.responsibleUserName ?? null,
      industryId: row.industryId,
      industryName: row.industryName ?? null,
    }))
  })

export const fetchSignal = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.signal.findFirst({
      where: and(eq(signal.id, data.id), isNull(signal.deletedAt)),
      with: {
        company: { columns: { id: true, name: true } },
        department: { columns: { id: true, name: true } },
        responsible: { columns: { id: true, name: true } },
        industry: { columns: { id: true, name: true } },
        signalType: { columns: { id: true, name: true } },
        lostReason: { columns: { id: true, name: true } },
      },
    })
    if (!row) throw notFound()
    return row
  })

export const addSignal = createServerFn({ method: 'POST' })
  .inputValidator(signalInputSchema)
  .handler(async ({ data }) => {
    const firstStage = await db.query.entityStage.findFirst({
      where: eq(entityStage.entityType, 'signal'),
      orderBy: [asc(entityStage.order)],
      columns: { id: true },
    })
    const [inserted] = await db
      .insert(signal)
      .values({
        title: data.title,
        companyId: data.companyId ?? null,
        departmentId: data.departmentId ?? null,
        responsibleUserId: data.responsibleUserId ?? null,
        industryId: data.industryId ?? null,
        signalTypeId: data.signalTypeId ?? null,
        stageId: data.stageId ?? firstStage?.id ?? null,
        status: data.status,
        rating: data.rating ?? null,
        description: data.description ?? null,
        lostReasonId: data.lostReasonId ?? null,
      })
      .returning({ id: signal.id })
    return { id: inserted.id }
  })

export const updateSignal = createServerFn({ method: 'POST' })
  .inputValidator(updateSignalSchema)
  .handler(async ({ data }) => {
    await db
      .update(signal)
      .set({
        title: data.title,
        companyId: data.companyId ?? null,
        departmentId: data.departmentId ?? null,
        responsibleUserId: data.responsibleUserId ?? null,
        industryId: data.industryId ?? null,
        signalTypeId: data.signalTypeId ?? null,
        status: data.status,
        rating: data.rating ?? null,
        description: data.description ?? null,
        lostReasonId: data.lostReasonId ?? null,
      })
      .where(eq(signal.id, data.id))
  })

// ---------------------------------------------------------------------------
// Kanban: stage move + reject + archive
// ---------------------------------------------------------------------------

export const moveSignalStage = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string(), stageId: z.string() }))
  .handler(async ({ data }) => {
    const firstStage = await db.query.entityStage.findFirst({
      where: eq(entityStage.entityType, 'signal'),
      orderBy: [asc(entityStage.order)],
      columns: { id: true },
    })
    const existing = await db.query.signal.findFirst({
      where: and(eq(signal.id, data.id), isNull(signal.deletedAt)),
      columns: { id: true, status: true },
    })
    if (!existing) throw notFound()

    const promote = existing.status === 'new' && data.stageId !== firstStage?.id

    await db
      .update(signal)
      .set({
        stageId: data.stageId,
        ...(promote ? { status: 'in_progress' as const } : {}),
      })
      .where(eq(signal.id, data.id))
    return { id: data.id }
  })

export const rejectSignal = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      lostReasonId: z.string().min(1, 'Выберите причину'),
    }),
  )
  .handler(async ({ data }) => {
    const rows = await db
      .update(signal)
      .set({ status: 'rejected', lostReasonId: data.lostReasonId })
      .where(and(eq(signal.id, data.id), isNull(signal.deletedAt)))
      .returning({
        id: signal.id,
        departmentId: signal.departmentId,
        responsibleUserId: signal.responsibleUserId,
      })
    const updated = rows.at(0)
    if (!updated) throw notFound()

    await recordQualification({
      entityType: 'signal',
      entityId: data.id,
      departmentId: updated.departmentId,
      responsibleUserId: updated.responsibleUserId,
    })
    return { id: data.id }
  })

export const archiveSignal = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const existing = await db.query.signal.findFirst({
      where: and(eq(signal.id, data.id), isNull(signal.deletedAt)),
      columns: { id: true, status: true },
    })
    if (!existing) throw notFound()

    // Only resolved signals may be archived.
    if (existing.status !== 'converted' && existing.status !== 'rejected') {
      throw new Error(
        'Архивировать можно только конвертированные или отклонённые записи',
      )
    }

    await db
      .update(signal)
      .set({ archivedAt: new Date() })
      .where(eq(signal.id, data.id))
    return { id: data.id }
  })

export const updateSignalRating = createServerFn({ method: 'POST' })
  .inputValidator(updateSignalRatingSchema)
  .handler(async ({ data }) => {
    await db
      .update(signal)
      .set({ rating: data.rating })
      .where(and(eq(signal.id, data.id), isNull(signal.deletedAt)))
  })

export const softDeleteSignal = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .update(signal)
      .set({ deletedAt: new Date() })
      .where(eq(signal.id, data.id))
  })
