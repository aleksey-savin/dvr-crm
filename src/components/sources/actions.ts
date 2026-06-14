import { db } from '@/db'
import { source, lead } from '@/db/schema'
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { asc, eq } from 'drizzle-orm'
import * as z from 'zod'

const sourceSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
})

const updateSourceSchema = sourceSchema.extend({
  id: z.string(),
})

export const fetchSources = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db.query.source.findMany({
      orderBy: [asc(source.name)],
    })
  },
)

export const fetchSource = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.source.findFirst({
      where: eq(source.id, data.id),
    })

    if (!row) throw notFound()
    return row
  })

export const addSource = createServerFn({ method: 'POST' })
  .inputValidator(sourceSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(source)
      .values({ name: data.name.trim() })
      .returning({ id: source.id })

    return inserted.id
  })

export const updateSource = createServerFn({ method: 'POST' })
  .inputValidator(updateSourceSchema)
  .handler(async ({ data }) => {
    await db
      .update(source)
      .set({ name: data.name.trim() })
      .where(eq(source.id, data.id))
  })

export const deleteSource = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    await db.transaction(async (tx) => {
      await tx.update(lead).set({ sourceId: null }).where(eq(lead.sourceId, id))

      await tx.delete(source).where(eq(source.id, id))
    })
  })
