import { db } from '@/db'
import { signalTypeTable, signal } from '@/db/schema'
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { asc, eq } from 'drizzle-orm'
import * as z from 'zod'

const signalTypeSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
})

const updateSignalTypeSchema = signalTypeSchema.extend({
  id: z.string(),
})

export const fetchSignalTypes = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db.query.signalTypeTable.findMany({
      orderBy: [asc(signalTypeTable.name)],
    })
  },
)

export const fetchSignalType = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.signalTypeTable.findFirst({
      where: eq(signalTypeTable.id, data.id),
    })

    if (!row) throw notFound()
    return row
  })

export const addSignalType = createServerFn({ method: 'POST' })
  .inputValidator(signalTypeSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(signalTypeTable)
      .values({ name: data.name.trim() })
      .returning({ id: signalTypeTable.id })

    return inserted.id
  })

export const updateSignalType = createServerFn({ method: 'POST' })
  .inputValidator(updateSignalTypeSchema)
  .handler(async ({ data }) => {
    await db
      .update(signalTypeTable)
      .set({ name: data.name.trim() })
      .where(eq(signalTypeTable.id, data.id))
  })

export const deleteSignalType = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    await db.transaction(async (tx) => {
      await tx
        .update(signal)
        .set({ signalTypeId: null })
        .where(eq(signal.signalTypeId, id))

      await tx.delete(signalTypeTable).where(eq(signalTypeTable.id, id))
    })
  })
