import { db } from '@/db'
import {
  lead,
  entityStage,
  company,
  department,
  user,
  industry,
  source,
  refusalReason,
} from '@/db/schema'
import { recordQualification } from '@/components/pipeline-entity/qualification'
import type { LeadRow } from '@/types'
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

const leadInputSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  companyId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  responsibleUserId: z.string().nullable().optional(),
  industryId: z.string().nullable().optional(),
  sourceId: z.string().nullable().optional(),
  stageId: z.string().nullable().optional(),
  status: z
    .enum(['new', 'in_progress', 'converted', 'rejected'])
    .default('new'),
  budget: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  lostReasonId: z.string().nullable().optional(),
})

const updateLeadSchema = leadInputSchema.extend({
  id: z.string(),
})

const updateLeadStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['new', 'in_progress', 'rejected']),
})

const rejectLeadSchema = z.object({
  id: z.string(),
  lostReasonId: z.string().min(1, 'Выберите причину'),
})

export const fetchLeads = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({ includeArchived: z.boolean().optional() }).optional(),
  )
  .handler(async ({ data }): Promise<LeadRow[]> => {
    const deptFilter = await buildDepartmentScopeFilter(lead.departmentId, {
      bypassRoles: ['admin', 'tender_specialist'],
    })

    const rows = await db
      .select({
        id: lead.id,
        title: lead.title,
        status: lead.status,
        sourceId: lead.sourceId,
        sourceName: source.name,
        lostReasonId: lead.lostReasonId,
        lostReasonName: refusalReason.name,
        stageId: lead.stageId,
        stageName: entityStage.name,
        stageColor: entityStage.color,
        stageOrder: entityStage.order,
        budget: lead.budget,
        dueDate: lead.dueDate,
        createdAt: lead.createdAt,
        archivedAt: lead.archivedAt,
        companyId: lead.companyId,
        companyName: company.name,
        departmentId: lead.departmentId,
        departmentName: department.name,
        departmentAccentColor: department.accentColor,
        responsibleUserId: lead.responsibleUserId,
        responsibleUserName: user.name,
        industryId: lead.industryId,
        industryName: industry.name,
      })
      .from(lead)
      .leftJoin(company, eq(lead.companyId, company.id))
      .leftJoin(department, eq(lead.departmentId, department.id))
      .leftJoin(user, eq(lead.responsibleUserId, user.id))
      .leftJoin(industry, eq(lead.industryId, industry.id))
      .leftJoin(source, eq(lead.sourceId, source.id))
      .leftJoin(refusalReason, eq(lead.lostReasonId, refusalReason.id))
      .leftJoin(entityStage, eq(lead.stageId, entityStage.id))
      .where(
        and(
          isNull(lead.deletedAt),
          data?.includeArchived ? undefined : isNull(lead.archivedAt),
          deptFilter,
        ),
      )
      .orderBy(asc(lead.position), asc(lead.createdAt))

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status as LeadRow['status'],
      sourceId: row.sourceId,
      sourceName: row.sourceName ?? null,
      lostReasonId: row.lostReasonId,
      lostReasonName: row.lostReasonName ?? null,
      stageId: row.stageId,
      stageName: row.stageName ?? null,
      stageColor: row.stageColor ?? null,
      stageOrder: row.stageOrder ?? null,
      budget: row.budget,
      dueDate: row.dueDate,
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

export const fetchLead = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.lead.findFirst({
      where: and(eq(lead.id, data.id), isNull(lead.deletedAt)),
      with: {
        company: { columns: { id: true, name: true } },
        department: { columns: { id: true, name: true } },
        responsible: { columns: { id: true, name: true } },
        industry: { columns: { id: true, name: true } },
        source: { columns: { id: true, name: true } },
        lostReason: { columns: { id: true, name: true } },
      },
    })
    if (!row) throw notFound()
    return row
  })

export const addLead = createServerFn({ method: 'POST' })
  .inputValidator(leadInputSchema)
  .handler(async ({ data }) => {
    // New leads always start in the first kanban column.
    const firstStage = await db.query.entityStage.findFirst({
      where: eq(entityStage.entityType, 'lead'),
      orderBy: [asc(entityStage.order)],
      columns: { id: true },
    })
    const [inserted] = await db
      .insert(lead)
      .values({
        title: data.title,
        companyId: data.companyId ?? null,
        departmentId: data.departmentId ?? null,
        responsibleUserId: data.responsibleUserId ?? null,
        industryId: data.industryId ?? null,
        sourceId: data.sourceId ?? null,
        stageId: data.stageId ?? firstStage?.id ?? null,
        status: data.status,
        budget: data.budget ?? null,
        description: data.description ?? null,
        dueDate: data.dueDate ?? null,
        lostReasonId: data.lostReasonId ?? null,
      })
      .returning({ id: lead.id })
    return { id: inserted.id }
  })

export const updateLead = createServerFn({ method: 'POST' })
  .inputValidator(updateLeadSchema)
  .handler(async ({ data }) => {
    await db
      .update(lead)
      .set({
        title: data.title,
        companyId: data.companyId ?? null,
        departmentId: data.departmentId ?? null,
        responsibleUserId: data.responsibleUserId ?? null,
        industryId: data.industryId ?? null,
        sourceId: data.sourceId ?? null,
        status: data.status,
        budget: data.budget ?? null,
        description: data.description ?? null,
        dueDate: data.dueDate ?? null,
        lostReasonId: data.lostReasonId ?? null,
      })
      .where(eq(lead.id, data.id))
  })

export const updateLeadStatus = createServerFn({ method: 'POST' })
  .inputValidator(updateLeadStatusSchema)
  .handler(async ({ data }) => {
    const currentUser =
      data.status === 'in_progress' ? await getCurrentUserWithDeptId() : null
    if (data.status === 'in_progress' && !currentUser) {
      throw new Error('Unauthorized')
    }

    const updatedLeads = await db
      .update(lead)
      .set({
        status: data.status,
        ...(data.status === 'in_progress'
          ? { responsibleUserId: currentUser?.id }
          : {}),
      })
      .where(and(eq(lead.id, data.id), isNull(lead.deletedAt)))
      .returning()
    const updatedLead = updatedLeads.at(0)

    if (!updatedLead) throw notFound()

    return { id: updatedLead.id }
  })

export const rejectLead = createServerFn({ method: 'POST' })
  .inputValidator(rejectLeadSchema)
  .handler(async ({ data }) => {
    const updatedRows = await db
      .update(lead)
      .set({ status: 'rejected', lostReasonId: data.lostReasonId })
      .where(and(eq(lead.id, data.id), isNull(lead.deletedAt)))
      .returning()
    const updated = updatedRows.at(0)
    if (!updated) throw notFound()

    await recordQualification({
      entityType: 'lead',
      entityId: data.id,
      departmentId: updated.departmentId,
      responsibleUserId: updated.responsibleUserId,
    })
  })

export const softDeleteLead = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .update(lead)
      .set({ deletedAt: new Date() })
      .where(eq(lead.id, data.id))
  })

// ---------------------------------------------------------------------------
// Kanban: stage move + archive
// ---------------------------------------------------------------------------

export const moveLeadStage = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string(), stageId: z.string() }))
  .handler(async ({ data }) => {
    const firstStage = await db.query.entityStage.findFirst({
      where: eq(entityStage.entityType, 'lead'),
      orderBy: [asc(entityStage.order)],
      columns: { id: true },
    })
    const existing = await db.query.lead.findFirst({
      where: and(eq(lead.id, data.id), isNull(lead.deletedAt)),
      columns: { id: true, status: true },
    })
    if (!existing) throw notFound()

    // Moving a `new` lead past the first column promotes it to in_progress.
    const promote = existing.status === 'new' && data.stageId !== firstStage?.id

    await db
      .update(lead)
      .set({
        stageId: data.stageId,
        ...(promote ? { status: 'in_progress' as const } : {}),
      })
      .where(eq(lead.id, data.id))
    return { id: data.id }
  })

export const archiveLead = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const existing = await db.query.lead.findFirst({
      where: and(eq(lead.id, data.id), isNull(lead.deletedAt)),
      columns: { id: true, status: true },
    })
    if (!existing) throw notFound()

    // Only resolved leads may be archived.
    if (existing.status !== 'converted' && existing.status !== 'rejected') {
      throw new Error(
        'Архивировать можно только конвертированные или отклонённые записи',
      )
    }

    await db
      .update(lead)
      .set({ archivedAt: new Date() })
      .where(eq(lead.id, data.id))
    return { id: data.id }
  })
