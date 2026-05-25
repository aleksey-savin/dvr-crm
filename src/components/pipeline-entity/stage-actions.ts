import { db } from '@/db'
import { entityStage, lead, tender, signal } from '@/db/schema'
import type { EntityStageOption } from '@/types'
import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq } from 'drizzle-orm'
import * as z from 'zod'

const entityTypeSchema = z.enum(['lead', 'tender', 'signal'])

async function repointStage(
  entityType: z.infer<typeof entityTypeSchema>,
  fromStageId: string,
  toStageId: string,
) {
  if (entityType === 'lead') {
    await db
      .update(lead)
      .set({ stageId: toStageId })
      .where(eq(lead.stageId, fromStageId))
  } else if (entityType === 'tender') {
    await db
      .update(tender)
      .set({ stageId: toStageId })
      .where(eq(tender.stageId, fromStageId))
  } else {
    await db
      .update(signal)
      .set({ stageId: toStageId })
      .where(eq(signal.stageId, fromStageId))
  }
}

export const fetchStages = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ entityType: entityTypeSchema }))
  .handler(async ({ data }): Promise<EntityStageOption[]> => {
    return db
      .select({
        id: entityStage.id,
        name: entityStage.name,
        color: entityStage.color,
        order: entityStage.order,
      })
      .from(entityStage)
      .where(eq(entityStage.entityType, data.entityType))
      .orderBy(asc(entityStage.order))
  })

export const addStage = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      entityType: entityTypeSchema,
      name: z.string().min(1, 'Название обязательно'),
      color: z.string().default('#6b7280'),
    }),
  )
  .handler(async ({ data }) => {
    const existing = await db
      .select({ order: entityStage.order })
      .from(entityStage)
      .where(eq(entityStage.entityType, data.entityType))
    const nextOrder =
      existing.length > 0 ? Math.max(...existing.map((s) => s.order)) + 1 : 0
    const [inserted] = await db
      .insert(entityStage)
      .values({
        entityType: data.entityType,
        name: data.name,
        color: data.color,
        order: nextOrder,
      })
      .returning({ id: entityStage.id })
    return { id: inserted.id }
  })

export const updateStage = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      name: z.string().min(1, 'Название обязательно').optional(),
      color: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const updates: { name?: string; color?: string } = {}
    if (data.name !== undefined) updates.name = data.name
    if (data.color !== undefined) updates.color = data.color
    if (Object.keys(updates).length === 0) return
    await db.update(entityStage).set(updates).where(eq(entityStage.id, data.id))
  })

export const deleteStage = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      entityType: entityTypeSchema,
      id: z.string(),
      reassignToStageId: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    if (data.reassignToStageId) {
      await repointStage(data.entityType, data.id, data.reassignToStageId)
    }
    await db
      .delete(entityStage)
      .where(
        and(
          eq(entityStage.id, data.id),
          eq(entityStage.entityType, data.entityType),
        ),
      )
  })

export const reorderStages = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ stageIds: z.array(z.string()) }))
  .handler(async ({ data }) => {
    for (let i = 0; i < data.stageIds.length; i++) {
      await db
        .update(entityStage)
        .set({ order: i })
        .where(eq(entityStage.id, data.stageIds[i]))
    }
  })

// Persist the within-column card order: position = index for each id.
export const reorderEntities = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      entityType: entityTypeSchema,
      orderedIds: z.array(z.string()),
    }),
  )
  .handler(async ({ data }) => {
    const setPosition = async (id: string, position: number) => {
      if (data.entityType === 'lead') {
        await db.update(lead).set({ position }).where(eq(lead.id, id))
      } else if (data.entityType === 'tender') {
        await db.update(tender).set({ position }).where(eq(tender.id, id))
      } else {
        await db.update(signal).set({ position }).where(eq(signal.id, id))
      }
    }
    for (let i = 0; i < data.orderedIds.length; i++) {
      await setPosition(data.orderedIds[i], i)
    }
  })
