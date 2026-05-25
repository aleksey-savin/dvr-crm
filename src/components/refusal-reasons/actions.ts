import { db } from '@/db'
import { refusalReason, lead, tender, signal } from '@/db/schema'
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { arrayContains, asc, eq } from 'drizzle-orm'
import * as z from 'zod'

const entityEnum = z.enum(['lead', 'tender', 'signal'])

const refusalReasonSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  entityTypes: z.array(entityEnum).min(1, 'Выберите хотя бы одну сущность'),
})

const updateRefusalReasonSchema = refusalReasonSchema.extend({
  id: z.string(),
})

export const fetchRefusalReasons = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ entityType: entityEnum.optional() }).optional())
  .handler(async ({ data }) => {
    return db.query.refusalReason.findMany({
      where: data?.entityType
        ? arrayContains(refusalReason.entityTypes, [data.entityType])
        : undefined,
      orderBy: [asc(refusalReason.name)],
    })
  })

export const fetchRefusalReason = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.refusalReason.findFirst({
      where: eq(refusalReason.id, data.id),
    })

    if (!row) throw notFound()
    return row
  })

export const addRefusalReason = createServerFn({ method: 'POST' })
  .inputValidator(refusalReasonSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(refusalReason)
      .values({ name: data.name.trim(), entityTypes: data.entityTypes })
      .returning({ id: refusalReason.id })

    return inserted.id
  })

export const updateRefusalReason = createServerFn({ method: 'POST' })
  .inputValidator(updateRefusalReasonSchema)
  .handler(async ({ data }) => {
    await db
      .update(refusalReason)
      .set({ name: data.name.trim(), entityTypes: data.entityTypes })
      .where(eq(refusalReason.id, data.id))
  })

export const deleteRefusalReason = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    await db.transaction(async (tx) => {
      await tx
        .update(lead)
        .set({ lostReasonId: null })
        .where(eq(lead.lostReasonId, id))

      await tx
        .update(tender)
        .set({ lostReasonId: null })
        .where(eq(tender.lostReasonId, id))

      await tx
        .update(signal)
        .set({ lostReasonId: null })
        .where(eq(signal.lostReasonId, id))

      await tx.delete(refusalReason).where(eq(refusalReason.id, id))
    })
  })
