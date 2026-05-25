import { db } from '@/db'
import {
  tender,
  entityStage,
  company,
  department,
  user,
  industry,
  refusalReason,
} from '@/db/schema'
import { recordQualification } from '@/components/pipeline-entity/qualification'
import type { TenderRow } from '@/types'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { notFound } from '@tanstack/react-router'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { auth } from 'utils/auth'
import { buildDepartmentScopeFilter } from '@/lib/department-scope'
import * as z from 'zod'

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

const tenderInputSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  companyId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  responsibleUserId: z.string().nullable().optional(),
  approverUserId: z.string().nullable().optional(),
  industryId: z.string().nullable().optional(),
  stageId: z.string().nullable().optional(),
  status: z
    .enum(['new', 'in_progress', 'converted', 'rejected'])
    .default('new'),
  amount: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  platform: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  lostReasonId: z.string().nullable().optional(),
})

const updateTenderSchema = tenderInputSchema.extend({ id: z.string() })

export const fetchTenders = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({ includeArchived: z.boolean().optional() }).optional(),
  )
  .handler(async ({ data }): Promise<TenderRow[]> => {
    const deptFilter = await buildDepartmentScopeFilter(tender.departmentId, {
      bypassRoles: ['admin', 'tender_specialist'],
    })

    const rows = await db
      .select({
        id: tender.id,
        title: tender.title,
        status: tender.status,
        stageId: tender.stageId,
        stageName: entityStage.name,
        stageColor: entityStage.color,
        stageOrder: entityStage.order,
        amount: tender.amount,
        deadline: tender.deadline,
        platform: tender.platform,
        url: tender.url,
        lostReasonId: tender.lostReasonId,
        lostReasonName: refusalReason.name,
        createdAt: tender.createdAt,
        archivedAt: tender.archivedAt,
        companyId: tender.companyId,
        companyName: company.name,
        departmentId: tender.departmentId,
        departmentName: department.name,
        departmentAccentColor: department.accentColor,
        responsibleUserId: tender.responsibleUserId,
        responsibleUserName: user.name,
        approverUserId: tender.approverUserId,
        industryId: tender.industryId,
        industryName: industry.name,
      })
      .from(tender)
      .leftJoin(company, eq(tender.companyId, company.id))
      .leftJoin(department, eq(tender.departmentId, department.id))
      .leftJoin(user, eq(tender.responsibleUserId, user.id))
      .leftJoin(industry, eq(tender.industryId, industry.id))
      .leftJoin(refusalReason, eq(tender.lostReasonId, refusalReason.id))
      .leftJoin(entityStage, eq(tender.stageId, entityStage.id))
      .where(
        and(
          isNull(tender.deletedAt),
          data?.includeArchived ? undefined : isNull(tender.archivedAt),
          deptFilter,
        ),
      )
      .orderBy(asc(tender.position), asc(tender.createdAt))

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status as TenderRow['status'],
      stageId: row.stageId,
      stageName: row.stageName ?? null,
      stageColor: row.stageColor ?? null,
      stageOrder: row.stageOrder ?? null,
      amount: row.amount,
      deadline: row.deadline,
      platform: row.platform,
      url: row.url,
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
      approverUserId: row.approverUserId,
      approverUserName: null,
      industryId: row.industryId,
      industryName: row.industryName ?? null,
    }))
  })

export const fetchTender = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.tender.findFirst({
      where: and(eq(tender.id, data.id), isNull(tender.deletedAt)),
      with: {
        company: { columns: { id: true, name: true } },
        department: { columns: { id: true, name: true } },
        responsible: { columns: { id: true, name: true } },
        approver: { columns: { id: true, name: true } },
        industry: { columns: { id: true, name: true } },
        lostReason: { columns: { id: true, name: true } },
      },
    })
    if (!row) throw notFound()
    return row
  })

export const addTender = createServerFn({ method: 'POST' })
  .inputValidator(tenderInputSchema)
  .handler(async ({ data }) => {
    // New tenders always start in the first kanban column.
    const firstStage = await db.query.entityStage.findFirst({
      where: eq(entityStage.entityType, 'tender'),
      orderBy: [asc(entityStage.order)],
      columns: { id: true },
    })
    const [inserted] = await db
      .insert(tender)
      .values({
        title: data.title,
        companyId: data.companyId ?? null,
        departmentId: data.departmentId ?? null,
        responsibleUserId: data.responsibleUserId ?? null,
        approverUserId: data.approverUserId ?? null,
        industryId: data.industryId ?? null,
        stageId: data.stageId ?? firstStage?.id ?? null,
        status: data.status,
        amount: data.amount ?? null,
        description: data.description ?? null,
        deadline: data.deadline ?? null,
        platform: data.platform ?? null,
        url: data.url ?? null,
        lostReasonId: data.lostReasonId ?? null,
      })
      .returning({ id: tender.id })
    return { id: inserted.id }
  })

export const updateTender = createServerFn({ method: 'POST' })
  .inputValidator(updateTenderSchema)
  .handler(async ({ data }) => {
    await db
      .update(tender)
      .set({
        title: data.title,
        companyId: data.companyId ?? null,
        departmentId: data.departmentId ?? null,
        responsibleUserId: data.responsibleUserId ?? null,
        approverUserId: data.approverUserId ?? null,
        industryId: data.industryId ?? null,
        status: data.status,
        amount: data.amount ?? null,
        description: data.description ?? null,
        deadline: data.deadline ?? null,
        platform: data.platform ?? null,
        url: data.url ?? null,
        lostReasonId: data.lostReasonId ?? null,
      })
      .where(eq(tender.id, data.id))
  })

// ---------------------------------------------------------------------------
// Kanban: stage move + reject + archive
// ---------------------------------------------------------------------------

export const moveTenderStage = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string(), stageId: z.string() }))
  .handler(async ({ data }) => {
    const firstStage = await db.query.entityStage.findFirst({
      where: eq(entityStage.entityType, 'tender'),
      orderBy: [asc(entityStage.order)],
      columns: { id: true },
    })
    const existing = await db.query.tender.findFirst({
      where: and(eq(tender.id, data.id), isNull(tender.deletedAt)),
      columns: { id: true, status: true, responsibleUserId: true },
    })
    if (!existing) throw notFound()

    // Moving a `new` tender past the first column promotes it to in_progress
    // and assigns the current user as responsible if none is set yet.
    const promote = existing.status === 'new' && data.stageId !== firstStage?.id
    const currentUser =
      promote && !existing.responsibleUserId
        ? await getCurrentUserWithDeptId()
        : null

    await db
      .update(tender)
      .set({
        stageId: data.stageId,
        ...(promote ? { status: 'in_progress' as const } : {}),
        ...(currentUser ? { responsibleUserId: currentUser.id } : {}),
      })
      .where(eq(tender.id, data.id))
    return { id: data.id }
  })

export const rejectTender = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      lostReasonId: z.string().min(1, 'Выберите причину'),
    }),
  )
  .handler(async ({ data }) => {
    const rows = await db
      .update(tender)
      .set({ status: 'rejected', lostReasonId: data.lostReasonId })
      .where(and(eq(tender.id, data.id), isNull(tender.deletedAt)))
      .returning({
        id: tender.id,
        departmentId: tender.departmentId,
        responsibleUserId: tender.responsibleUserId,
      })
    const updated = rows.at(0)
    if (!updated) throw notFound()

    await recordQualification({
      entityType: 'tender',
      entityId: data.id,
      departmentId: updated.departmentId,
      responsibleUserId: updated.responsibleUserId,
    })
    return { id: data.id }
  })

export const archiveTender = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const existing = await db.query.tender.findFirst({
      where: and(eq(tender.id, data.id), isNull(tender.deletedAt)),
      columns: { id: true, status: true },
    })
    if (!existing) throw notFound()

    // Only resolved tenders may be archived.
    if (existing.status !== 'converted' && existing.status !== 'rejected') {
      throw new Error(
        'Архивировать можно только конвертированные или отклонённые записи',
      )
    }

    await db
      .update(tender)
      .set({ archivedAt: new Date() })
      .where(eq(tender.id, data.id))
    return { id: data.id }
  })

export const softDeleteTender = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .update(tender)
      .set({ deletedAt: new Date() })
      .where(eq(tender.id, data.id))
  })
