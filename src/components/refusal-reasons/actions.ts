import { db } from '@/db'
import { refusalReason, lead, tender } from '@/db/schema'
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { asc, eq } from 'drizzle-orm'
import * as z from 'zod'

const refusalReasonSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
})

const updateRefusalReasonSchema = refusalReasonSchema.extend({
  id: z.string(),
})

export const fetchRefusalReasons = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db.query.refusalReason.findMany({
      orderBy: [asc(refusalReason.name)],
    })
  },
)

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
      .values({ name: data.name.trim() })
      .returning({ id: refusalReason.id })

    return inserted.id
  })

export const updateRefusalReason = createServerFn({ method: 'POST' })
  .inputValidator(updateRefusalReasonSchema)
  .handler(async ({ data }) => {
    await db
      .update(refusalReason)
      .set({ name: data.name.trim() })
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

      await tx.delete(refusalReason).where(eq(refusalReason.id, id))
    })
  })
