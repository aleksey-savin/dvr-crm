import { db } from '@/db'
import { tag } from '@/db/schema'
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { asc, eq } from 'drizzle-orm'
import * as z from 'zod'

const tagSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
})

const updateTagSchema = tagSchema.extend({
  id: z.string(),
})

export const fetchTags = createServerFn({ method: 'GET' }).handler(async () => {
  return db.query.tag.findMany({
    orderBy: [asc(tag.name)],
  })
})

export const fetchTag = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.tag.findFirst({
      where: eq(tag.id, data.id),
    })

    if (!row) throw notFound()
    return row
  })

export const addTag = createServerFn({ method: 'POST' })
  .inputValidator(tagSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(tag)
      .values({ name: data.name.trim() })
      .returning({ id: tag.id })

    return inserted.id
  })

export const updateTag = createServerFn({ method: 'POST' })
  .inputValidator(updateTagSchema)
  .handler(async ({ data }) => {
    await db
      .update(tag)
      .set({ name: data.name.trim() })
      .where(eq(tag.id, data.id))
  })

export const deleteTag = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    await db.delete(tag).where(eq(tag.id, id))
  })
