import { db } from '@/db'
import {
  lead,
  company,
  department,
  user,
  industry,
  targetAction,
  targetActionType,
  source,
  refusalReason,
} from '@/db/schema'
import type { LeadRow } from '@/types'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { notFound } from '@tanstack/react-router'
import { and, eq, isNull, or } from 'drizzle-orm'
import { auth } from 'utils/auth'

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

export const fetchLeads = createServerFn({ method: 'GET' }).handler(
  async (): Promise<LeadRow[]> => {
    const currentUser = await getCurrentUserWithDeptId()

    const rows = await db
      .select({
        id: lead.id,
        title: lead.title,
        status: lead.status,
        sourceId: lead.sourceId,
        sourceName: source.name,
        lostReasonId: lead.lostReasonId,
        lostReasonName: refusalReason.name,
        budget: lead.budget,
        dueDate: lead.dueDate,
        createdAt: lead.createdAt,
        companyId: lead.companyId,
        companyName: company.name,
        departmentId: lead.departmentId,
        departmentName: department.name,
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
      .where(
        and(
          isNull(lead.deletedAt),
          currentUser?.role === 'admin' ||
            currentUser?.role === 'tender_specialist'
            ? undefined
            : currentUser?.departmentId
              ? or(
                  eq(lead.departmentId, currentUser.departmentId),
                  isNull(lead.departmentId),
                )
              : isNull(lead.departmentId),
        ),
      )

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status as LeadRow['status'],
      sourceId: row.sourceId,
      sourceName: row.sourceName ?? null,
      lostReasonId: row.lostReasonId,
      lostReasonName: row.lostReasonName ?? null,
      budget: row.budget,
      dueDate: row.dueDate,
      createdAt: row.createdAt,
      companyId: row.companyId,
      companyName: row.companyName ?? null,
      departmentId: row.departmentId,
      departmentName: row.departmentName ?? null,
      responsibleUserId: row.responsibleUserId,
      responsibleUserName: row.responsibleUserName ?? null,
      industryId: row.industryId,
      industryName: row.industryName ?? null,
    }))
  },
)

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
    const [inserted] = await db
      .insert(lead)
      .values({
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

    const currentUser = await getCurrentUserWithDeptId()
    const type = await db.query.targetActionType.findFirst({
      where: and(
        eq(targetActionType.slug, 'lead_qualification'),
        isNull(targetActionType.deletedAt),
      ),
    })
    if (!type) {
      console.warn(
        '[target-action] type "lead_qualification" not found — skipping.',
      )
      return
    }
    const now = new Date()
    await db.insert(targetAction).values({
      typeId: type.id,
      responsibleUserId: currentUser?.id ?? updated.responsibleUserId,
      departmentId: updated.departmentId,
      plannedAt: now.toISOString().split('T')[0],
      completedAt: now,
      status: 'completed',
      sourceType: 'lead',
      sourceId: data.id,
      leadId: data.id,
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

export const fetchCompanies = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select({ id: company.id, name: company.name })
      .from(company)
      .orderBy(company.name)
  },
)

export const fetchDepartments = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select({ id: department.id, name: department.name })
      .from(department)
      .orderBy(department.name)
  },
)

export const fetchUsers = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select({ id: user.id, name: user.name })
      .from(user)
      .orderBy(user.name)
  },
)

export const fetchIndustries = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select({ id: industry.id, name: industry.name })
      .from(industry)
      .orderBy(industry.name)
  },
)
