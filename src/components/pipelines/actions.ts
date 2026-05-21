import { db } from '@/db'
import {
  pipeline,
  pipelineStage,
  pipelineDepartment,
  department,
  initiative,
} from '@/db/schema'
import type { PipelineWithStages } from '@/types'
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { and, asc, eq, inArray } from 'drizzle-orm'
import * as z from 'zod'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const stageInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Название этапа обязательно'),
  color: z.string().default('#6b7280'),
  order: z.number().int().default(0),
  isWon: z.boolean().default(false),
  isLost: z.boolean().default(false),
})

const pipelineInputSchema = z.object({
  name: z.string().min(1, 'Название воронки обязательно'),
  description: z.string().nullable().optional(),
  departmentIds: z.array(z.string()).default([]),
  stages: z.array(stageInputSchema).default([]),
})

const updatePipelineSchema = pipelineInputSchema.extend({
  id: z.string(),
})

// ---------------------------------------------------------------------------
// Fetch all pipelines with stages and department links
// ---------------------------------------------------------------------------

export const fetchPipelines = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PipelineWithStages[]> => {
    const rows = await db.query.pipeline.findMany({
      with: {
        stages: {
          orderBy: [asc(pipelineStage.order)],
        },
        departments: true,
      },
      orderBy: [asc(pipeline.createdAt)],
    })

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      stages: row.stages.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        order: s.order,
        isWon: s.isWon,
        isLost: s.isLost,
      })),
      departmentIds: row.departments.map((d) => d.departmentId),
    }))
  },
)

// ---------------------------------------------------------------------------
// Fetch single pipeline
// ---------------------------------------------------------------------------

export const fetchPipeline = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<PipelineWithStages> => {
    const row = await db.query.pipeline.findFirst({
      where: eq(pipeline.id, data.id),
      with: {
        stages: { orderBy: [asc(pipelineStage.order)] },
        departments: true,
      },
    })
    if (!row) throw notFound()
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      stages: row.stages.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        order: s.order,
        isWon: s.isWon,
        isLost: s.isLost,
      })),
      departmentIds: row.departments.map((d) => d.departmentId),
    }
  })

// ---------------------------------------------------------------------------
// Fetch pipeline options (for initiative form dropdowns)
// ---------------------------------------------------------------------------

export const fetchPipelineOptions = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select({ id: pipeline.id, name: pipeline.name })
      .from(pipeline)
      .orderBy(asc(pipeline.name))
  },
)

// ---------------------------------------------------------------------------
// Add pipeline (atomically creates stages + department links)
// ---------------------------------------------------------------------------

export const addPipeline = createServerFn({ method: 'POST' })
  .inputValidator(pipelineInputSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(pipeline)
      .values({
        name: data.name,
        description: data.description ?? null,
      })
      .returning({ id: pipeline.id })

    const newId = inserted.id

    if (data.stages.length > 0) {
      await db.insert(pipelineStage).values(
        data.stages.map((s, idx) => ({
          pipelineId: newId,
          name: s.name,
          color: s.color,
          order: idx,
          isWon: s.isWon,
          isLost: s.isLost,
        })),
      )
    }

    if (data.departmentIds.length > 0) {
      await db.insert(pipelineDepartment).values(
        data.departmentIds.map((dId) => ({
          pipelineId: newId,
          departmentId: dId,
        })),
      )
    }

    return { id: newId }
  })

// ---------------------------------------------------------------------------
// Update pipeline (replaces stages, syncs department links)
// ---------------------------------------------------------------------------

export const updatePipeline = createServerFn({ method: 'POST' })
  .inputValidator(updatePipelineSchema)
  .handler(async ({ data }) => {
    await db
      .update(pipeline)
      .set({ name: data.name, description: data.description ?? null })
      .where(eq(pipeline.id, data.id))

    // Upsert stages by id so existing stages keep their primary key and the
    // initiatives referencing them via FK don't get orphaned.
    const existingStages = await db
      .select({ id: pipelineStage.id })
      .from(pipelineStage)
      .where(eq(pipelineStage.pipelineId, data.id))
    const existingStageIds = new Set(existingStages.map((s) => s.id))

    const incomingStageIds = new Set(
      data.stages.map((s) => s.id).filter((id): id is string => Boolean(id)),
    )
    const stagesToDelete = [...existingStageIds].filter(
      (id) => !incomingStageIds.has(id),
    )

    if (stagesToDelete.length > 0) {
      await db
        .delete(pipelineStage)
        .where(
          and(
            eq(pipelineStage.pipelineId, data.id),
            inArray(pipelineStage.id, stagesToDelete),
          ),
        )
    }

    for (let idx = 0; idx < data.stages.length; idx++) {
      const s = data.stages[idx]
      if (s.id && existingStageIds.has(s.id)) {
        await db
          .update(pipelineStage)
          .set({
            name: s.name,
            color: s.color,
            order: idx,
            isWon: s.isWon,
            isLost: s.isLost,
          })
          .where(eq(pipelineStage.id, s.id))
      } else {
        await db.insert(pipelineStage).values({
          pipelineId: data.id,
          name: s.name,
          color: s.color,
          order: idx,
          isWon: s.isWon,
          isLost: s.isLost,
        })
      }
    }

    // Sync department links: remove de-selected, add new
    const existing = await db
      .select({ departmentId: pipelineDepartment.departmentId })
      .from(pipelineDepartment)
      .where(eq(pipelineDepartment.pipelineId, data.id))

    const existingIds = existing.map((r) => r.departmentId)
    const toAdd = data.departmentIds.filter((id) => !existingIds.includes(id))
    const toRemove = existingIds.filter(
      (id) => !data.departmentIds.includes(id),
    )

    if (toRemove.length > 0) {
      await db
        .delete(pipelineDepartment)
        .where(
          and(
            eq(pipelineDepartment.pipelineId, data.id),
            inArray(pipelineDepartment.departmentId, toRemove),
          ),
        )
    }

    if (toAdd.length > 0) {
      await db
        .insert(pipelineDepartment)
        .values(
          toAdd.map((dId) => ({ pipelineId: data.id, departmentId: dId })),
        )
    }
  })

// ---------------------------------------------------------------------------
// Delete pipeline (cascade deletes stages + department links in DB)
// ---------------------------------------------------------------------------

export const deletePipeline = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(pipeline).where(eq(pipeline.id, data.id))
  })

// ---------------------------------------------------------------------------
// Stage CRUD (used for inline kanban column management)
// ---------------------------------------------------------------------------

export const addPipelineStage = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      pipelineId: z.string(),
      name: z.string().min(1, 'Название обязательно'),
      color: z.string().default('#6b7280'),
    }),
  )
  .handler(async ({ data }) => {
    const existing = await db
      .select({ order: pipelineStage.order })
      .from(pipelineStage)
      .where(eq(pipelineStage.pipelineId, data.pipelineId))
    const nextOrder =
      existing.length > 0 ? Math.max(...existing.map((s) => s.order)) + 1 : 0

    const [inserted] = await db
      .insert(pipelineStage)
      .values({
        pipelineId: data.pipelineId,
        name: data.name,
        color: data.color,
        order: nextOrder,
        isWon: false,
        isLost: false,
      })
      .returning({ id: pipelineStage.id })
    return { id: inserted.id }
  })

export const updatePipelineStage = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      name: z.string().min(1, 'Название обязательно').optional(),
      color: z.string().optional(),
      isWon: z.boolean().optional(),
      isLost: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const updates: {
      name?: string
      color?: string
      isWon?: boolean
      isLost?: boolean
    } = {}
    if (data.name !== undefined) updates.name = data.name
    if (data.color !== undefined) updates.color = data.color
    if (data.isWon !== undefined) updates.isWon = data.isWon
    if (data.isLost !== undefined) updates.isLost = data.isLost

    if (Object.keys(updates).length === 0) return

    await db
      .update(pipelineStage)
      .set(updates)
      .where(eq(pipelineStage.id, data.id))
  })

export const deletePipelineStage = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      reassignToStageId: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    // Move cards to the chosen stage before removing the column so they are
    // not orphaned (FK is set null on delete otherwise).
    if (data.reassignToStageId) {
      await db
        .update(initiative)
        .set({ stageId: data.reassignToStageId })
        .where(eq(initiative.stageId, data.id))
    }
    await db.delete(pipelineStage).where(eq(pipelineStage.id, data.id))
  })

export const reorderPipelineStages = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      pipelineId: z.string(),
      stageIds: z.array(z.string()),
    }),
  )
  .handler(async ({ data }) => {
    // Assign order = index for each stage in the provided sequence.
    for (let i = 0; i < data.stageIds.length; i++) {
      await db
        .update(pipelineStage)
        .set({ order: i })
        .where(
          and(
            eq(pipelineStage.id, data.stageIds[i]),
            eq(pipelineStage.pipelineId, data.pipelineId),
          ),
        )
    }
  })

// ---------------------------------------------------------------------------
// Fetch department options for pipeline form
// ---------------------------------------------------------------------------

export const fetchDepartmentOptions = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select({ id: department.id, name: department.name })
      .from(department)
      .orderBy(asc(department.name))
  },
)
