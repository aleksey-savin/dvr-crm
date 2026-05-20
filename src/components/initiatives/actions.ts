import { db } from '@/db'
import {
  initiative,
  pipeline,
  pipelineStage,
  company,
  department,
  user,
  refusalReason,
  lead,
  signal,
  targetAction,
  targetActionType,
} from '@/db/schema'
import type { InitiativeRow, InitiativeSource } from '@/types'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { notFound } from '@tanstack/react-router'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { auth } from 'utils/auth'
import * as z from 'zod'
import { buildDepartmentScopeFilter } from '@/lib/department-scope'
import { collectDepartmentDescendants } from '@/lib/department-tree'

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function getCurrentUser() {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return null
  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { id: true, role: true, departmentId: true },
  })
  return dbUser ?? null
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const initiativeInputSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  pipelineId: z.string().nullable().optional(),
  stageId: z.string().nullable().optional(),
  companyAccountId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  departmentId: z
    .string()
    .min(1, 'Подразделение обязательно')
    .nullish()
    .refine((v) => v != null && v.length > 0, {
      message: 'Подразделение обязательно',
    }),
  responsibleUserId: z.string().nullable().optional(),
  budget: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  sourceType: z
    .enum(['lead', 'signal', 'tender', 'account', 'manual'])
    .default('manual'),
  sourceLeadId: z.string().nullable().optional(),
  sourceSignalId: z.string().nullable().optional(),
})

const updateInitiativeSchema = initiativeInputSchema.extend({
  id: z.string(),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapRow(row: {
  id: string
  title: string
  budget: string | null
  dueDate: string | null
  closedAt: Date | null
  sourceType: string
  sourceLeadId: string | null
  sourceSignalId: string | null
  pipelineId: string | null
  pipelineName: string | null
  stageId: string | null
  stageName: string | null
  stageColor: string | null
  stageOrder: number | null
  stageIsWon: boolean | null
  stageIsLost: boolean | null
  companyAccountId: string | null
  companyId: string | null
  companyName: string | null
  departmentId: string | null
  departmentName: string | null
  responsibleUserId: string | null
  responsibleUserName: string | null
  refusalReasonId: string | null
  refusalReasonName: string | null
  createdAt: Date
  updatedAt: Date
}): InitiativeRow {
  return {
    ...row,
    sourceType: row.sourceType as InitiativeSource,
  }
}

// ---------------------------------------------------------------------------
// Fetch list
// ---------------------------------------------------------------------------

export const fetchInitiatives = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({ pipelineId: z.string().nullable().optional() }).optional(),
  )
  .handler(async ({ data }): Promise<InitiativeRow[]> => {
    const deptFilter = await buildDepartmentScopeFilter(initiative.departmentId)

    const rows = await db
      .select({
        id: initiative.id,
        title: initiative.title,
        budget: initiative.budget,
        dueDate: initiative.dueDate,
        closedAt: initiative.closedAt,
        sourceType: initiative.sourceType,
        sourceLeadId: initiative.sourceLeadId,
        sourceSignalId: initiative.sourceSignalId,
        pipelineId: initiative.pipelineId,
        pipelineName: pipeline.name,
        stageId: initiative.stageId,
        stageName: pipelineStage.name,
        stageColor: pipelineStage.color,
        stageOrder: pipelineStage.order,
        stageIsWon: pipelineStage.isWon,
        stageIsLost: pipelineStage.isLost,
        companyAccountId: initiative.companyAccountId,
        companyId: initiative.companyId,
        companyName: company.name,
        departmentId: initiative.departmentId,
        departmentName: department.name,
        responsibleUserId: initiative.responsibleUserId,
        responsibleUserName: user.name,
        refusalReasonId: initiative.refusalReasonId,
        refusalReasonName: refusalReason.name,
        createdAt: initiative.createdAt,
        updatedAt: initiative.updatedAt,
      })
      .from(initiative)
      .leftJoin(pipeline, eq(initiative.pipelineId, pipeline.id))
      .leftJoin(pipelineStage, eq(initiative.stageId, pipelineStage.id))
      .leftJoin(company, eq(initiative.companyId, company.id))
      .leftJoin(department, eq(initiative.departmentId, department.id))
      .leftJoin(user, eq(initiative.responsibleUserId, user.id))
      .leftJoin(refusalReason, eq(initiative.refusalReasonId, refusalReason.id))
      .where(
        and(
          isNull(initiative.deletedAt),
          data?.pipelineId
            ? eq(initiative.pipelineId, data.pipelineId)
            : undefined,
          deptFilter,
        ),
      )
      .orderBy(asc(pipelineStage.order), asc(initiative.createdAt))

    return rows.map(mapRow)
  })

// ---------------------------------------------------------------------------
// Fetch initiatives for a specific company account
// ---------------------------------------------------------------------------

export const fetchAccountInitiatives = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ companyAccountId: z.string() }))
  .handler(async ({ data }): Promise<InitiativeRow[]> => {
    const rows = await db
      .select({
        id: initiative.id,
        title: initiative.title,
        budget: initiative.budget,
        dueDate: initiative.dueDate,
        closedAt: initiative.closedAt,
        sourceType: initiative.sourceType,
        sourceLeadId: initiative.sourceLeadId,
        sourceSignalId: initiative.sourceSignalId,
        pipelineId: initiative.pipelineId,
        pipelineName: pipeline.name,
        stageId: initiative.stageId,
        stageName: pipelineStage.name,
        stageColor: pipelineStage.color,
        stageOrder: pipelineStage.order,
        stageIsWon: pipelineStage.isWon,
        stageIsLost: pipelineStage.isLost,
        companyAccountId: initiative.companyAccountId,
        companyId: initiative.companyId,
        companyName: company.name,
        departmentId: initiative.departmentId,
        departmentName: department.name,
        responsibleUserId: initiative.responsibleUserId,
        responsibleUserName: user.name,
        refusalReasonId: initiative.refusalReasonId,
        refusalReasonName: refusalReason.name,
        createdAt: initiative.createdAt,
        updatedAt: initiative.updatedAt,
      })
      .from(initiative)
      .leftJoin(pipeline, eq(initiative.pipelineId, pipeline.id))
      .leftJoin(pipelineStage, eq(initiative.stageId, pipelineStage.id))
      .leftJoin(company, eq(initiative.companyId, company.id))
      .leftJoin(department, eq(initiative.departmentId, department.id))
      .leftJoin(user, eq(initiative.responsibleUserId, user.id))
      .leftJoin(refusalReason, eq(initiative.refusalReasonId, refusalReason.id))
      .where(
        and(
          isNull(initiative.deletedAt),
          eq(initiative.companyAccountId, data.companyAccountId),
        ),
      )
      .orderBy(asc(initiative.createdAt))

    return rows.map(mapRow)
  })

// ---------------------------------------------------------------------------
// Fetch single
// ---------------------------------------------------------------------------

export const fetchInitiative = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.initiative.findFirst({
      where: and(eq(initiative.id, data.id), isNull(initiative.deletedAt)),
      with: {
        pipeline: { columns: { id: true, name: true } },
        stage: {
          columns: {
            id: true,
            name: true,
            color: true,
            order: true,
            isWon: true,
            isLost: true,
          },
        },
        company: { columns: { id: true, name: true } },
        companyAccount: { columns: { id: true, companyId: true } },
        department: { columns: { id: true, name: true } },
        responsible: { columns: { id: true, name: true } },
        sourceLead: { columns: { id: true, title: true } },
        sourceSignal: { columns: { id: true, title: true } },
        refusalReason: { columns: { id: true, name: true } },
      },
    })
    if (!row) throw notFound()
    return row
  })

// ---------------------------------------------------------------------------
// Add
// ---------------------------------------------------------------------------

export const addInitiative = createServerFn({ method: 'POST' })
  .inputValidator(initiativeInputSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(initiative)
      .values({
        title: data.title,
        pipelineId: data.pipelineId ?? null,
        stageId: data.stageId ?? null,
        companyAccountId: data.companyAccountId ?? null,
        companyId: data.companyId ?? null,
        departmentId: data.departmentId ?? null,
        responsibleUserId: data.responsibleUserId ?? null,
        budget: data.budget ?? null,
        description: data.description ?? null,
        dueDate: data.dueDate ?? null,
        sourceType: data.sourceType,
        sourceLeadId: data.sourceLeadId ?? null,
        sourceSignalId: data.sourceSignalId ?? null,
      })
      .returning({ id: initiative.id })
    return { id: inserted.id }
  })

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export const updateInitiative = createServerFn({ method: 'POST' })
  .inputValidator(updateInitiativeSchema)
  .handler(async ({ data }) => {
    await db
      .update(initiative)
      .set({
        title: data.title,
        pipelineId: data.pipelineId ?? null,
        stageId: data.stageId ?? null,
        companyAccountId: data.companyAccountId ?? null,
        companyId: data.companyId ?? null,
        departmentId: data.departmentId ?? null,
        responsibleUserId: data.responsibleUserId ?? null,
        budget: data.budget ?? null,
        description: data.description ?? null,
        dueDate: data.dueDate ?? null,
        sourceType: data.sourceType,
        sourceLeadId: data.sourceLeadId ?? null,
        sourceSignalId: data.sourceSignalId ?? null,
      })
      .where(and(eq(initiative.id, data.id), isNull(initiative.deletedAt)))
  })

// ---------------------------------------------------------------------------
// Move stage (drag-and-drop)
// ---------------------------------------------------------------------------

export const moveInitiativeStage = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string(), stageId: z.string() }))
  .handler(async ({ data }) => {
    await db
      .update(initiative)
      .set({ stageId: data.stageId })
      .where(and(eq(initiative.id, data.id), isNull(initiative.deletedAt)))
  })

// ---------------------------------------------------------------------------
// Close won
// ---------------------------------------------------------------------------

export const closeInitiativeWon = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string(), stageId: z.string() }))
  .handler(async ({ data }) => {
    await db
      .update(initiative)
      .set({ stageId: data.stageId, closedAt: new Date() })
      .where(and(eq(initiative.id, data.id), isNull(initiative.deletedAt)))
  })

// ---------------------------------------------------------------------------
// Close lost
// ---------------------------------------------------------------------------

export const closeInitiativeLost = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      stageId: z.string(),
      refusalReasonId: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await db
      .update(initiative)
      .set({
        stageId: data.stageId,
        refusalReasonId: data.refusalReasonId ?? null,
        closedAt: new Date(),
      })
      .where(and(eq(initiative.id, data.id), isNull(initiative.deletedAt)))
  })

// ---------------------------------------------------------------------------
// Soft delete
// ---------------------------------------------------------------------------

export const softDeleteInitiative = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .update(initiative)
      .set({ deletedAt: new Date() })
      .where(eq(initiative.id, data.id))
  })

// ---------------------------------------------------------------------------
// Convert lead → initiative
// ---------------------------------------------------------------------------

export const convertLeadToInitiative = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      leadId: z.string(),
      pipelineId: z.string().nullable().optional(),
      stageId: z.string().nullable().optional(),
      title: z.string().min(1),
      companyId: z.string().nullable().optional(),
      companyAccountId: z.string().nullable().optional(),
      departmentId: z.string().nullable().optional(),
      responsibleUserId: z.string().nullable().optional(),
      budget: z.string().nullable().optional(),
      dueDate: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(initiative)
      .values({
        title: data.title,
        pipelineId: data.pipelineId ?? null,
        stageId: data.stageId ?? null,
        companyId: data.companyId ?? null,
        companyAccountId: data.companyAccountId ?? null,
        departmentId: data.departmentId ?? null,
        responsibleUserId: data.responsibleUserId ?? null,
        budget: data.budget ?? null,
        dueDate: data.dueDate ?? null,
        description: data.description ?? null,
        sourceType: 'lead',
        sourceLeadId: data.leadId,
      })
      .returning({ id: initiative.id })

    const updatedLeadRows = await db
      .update(lead)
      .set({ status: 'converted' })
      .where(eq(lead.id, data.leadId))
      .returning()
    const updatedLead = updatedLeadRows.at(0)

    // Record a "lead qualification" target action as a system fact.
    const currentUser = await getCurrentUser()
    const type = await db.query.targetActionType.findFirst({
      where: and(
        eq(targetActionType.slug, 'lead_qualification'),
        isNull(targetActionType.deletedAt),
      ),
    })
    if (type && updatedLead) {
      const now = new Date()
      await db.insert(targetAction).values({
        typeId: type.id,
        responsibleUserId:
          currentUser?.id ?? updatedLead.responsibleUserId ?? null,
        departmentId: updatedLead.departmentId,
        plannedAt: now.toISOString().split('T')[0],
        completedAt: now,
        status: 'completed',
        sourceType: 'lead',
        sourceId: data.leadId,
        leadId: data.leadId,
        initiativeId: inserted.id,
      })
    } else if (!type) {
      console.warn(
        '[target-action] type "lead_qualification" not found — skipping.',
      )
    }

    return { id: inserted.id }
  })

// ---------------------------------------------------------------------------
// Convert signal → initiative
// ---------------------------------------------------------------------------

export const convertSignalToInitiative = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      signalId: z.string(),
      pipelineId: z.string().nullable().optional(),
      stageId: z.string().nullable().optional(),
      title: z.string().min(1),
      companyId: z.string().nullable().optional(),
      companyAccountId: z.string().nullable().optional(),
      departmentId: z.string().nullable().optional(),
      responsibleUserId: z.string().nullable().optional(),
      budget: z.string().nullable().optional(),
      dueDate: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(initiative)
      .values({
        title: data.title,
        pipelineId: data.pipelineId ?? null,
        stageId: data.stageId ?? null,
        companyId: data.companyId ?? null,
        companyAccountId: data.companyAccountId ?? null,
        departmentId: data.departmentId ?? null,
        responsibleUserId: data.responsibleUserId ?? null,
        budget: data.budget ?? null,
        dueDate: data.dueDate ?? null,
        description: data.description ?? null,
        sourceType: 'signal',
        sourceSignalId: data.signalId,
      })
      .returning({ id: initiative.id })

    await db
      .update(signal)
      .set({ status: 'converted' })
      .where(eq(signal.id, data.signalId))

    return { id: inserted.id }
  })

// ---------------------------------------------------------------------------
// Fetch options for dropdowns used in initiative form
// ---------------------------------------------------------------------------

export const fetchInitiativeFormOptions = createServerFn({
  method: 'GET',
}).handler(async () => {
  const currentUser = await getCurrentUser()

  const [allSalesDepts, allDepts, pipelines, users, companies, refusalReasons] =
    await Promise.all([
      db
        .select({
          id: department.id,
          name: department.name,
          parentId: department.parentId,
          headUserId: department.headUserId,
        })
        .from(department)
        .where(eq(department.departmentType, 'sales'))
        .orderBy(asc(department.name)),
      db
        .select({ id: department.id, parentId: department.parentId, headUserId: department.headUserId })
        .from(department),
      db.query.pipeline.findMany({
        with: { stages: { orderBy: [asc(pipelineStage.order)] }, departments: true },
        orderBy: [asc(pipeline.name)],
      }),
      db
        .select({ id: user.id, name: user.name, departmentId: user.departmentId, role: user.role })
        .from(user)
        .orderBy(asc(user.name)),
      db
        .select({ id: company.id, name: company.name })
        .from(company)
        .orderBy(asc(company.name)),
      db
        .select({ id: refusalReason.id, name: refusalReason.name })
        .from(refusalReason)
        .orderBy(asc(refusalReason.name)),
    ])

  let departments: Array<{ id: string; name: string; parentId: string | null }>

  if (currentUser) {
    if (currentUser.role === 'admin') {
      departments = allSalesDepts.map(({ id, name, parentId }) => ({ id, name, parentId }))
    } else {
      // Find all departments (any type) this user heads, then collect full subtree
      const headedDeptIds = allDepts
        .filter((d) => d.headUserId === currentUser.id)
        .map((d) => d.id)

      if (headedDeptIds.length > 0) {
        const allowed = new Set(collectDepartmentDescendants(allDepts, headedDeptIds))
        departments = allSalesDepts
          .filter((d) => allowed.has(d.id))
          .map(({ id, name, parentId }) => ({ id, name, parentId }))
      } else {
        // Regular user: only their own department (if it's a sales dept)
        departments = allSalesDepts
          .filter((d) => d.id === currentUser.departmentId)
          .map(({ id, name, parentId }) => ({ id, name, parentId }))
      }
    }
  } else {
    departments = allSalesDepts.map(({ id, name, parentId }) => ({ id, name, parentId }))
  }

  return {
    pipelines: pipelines.map((p) => ({
      id: p.id,
      name: p.name,
      departmentIds: p.departments.map((d) => d.departmentId),
      stages: p.stages.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        order: s.order,
        isWon: s.isWon,
        isLost: s.isLost,
      })),
    })),
    departments,
    users,
    companies,
    refusalReasons,
  }
})
