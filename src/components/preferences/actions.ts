import { db } from '@/db'
import { apiKey } from '@/db/schema'
import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import * as z from 'zod'

const addApiKeySchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  userId: z.string(),
})

const deleteApiKeySchema = z.object({
  id: z.string(),
  userId: z.string(),
})

const getApiKeysSchema = z.object({
  userId: z.string(),
})

export const addApiKey = createServerFn({ method: 'POST' })
  .inputValidator(addApiKeySchema)
  .handler(async ({ data }) => {
    const generatedKey = `sk-${crypto.randomUUID().replace(/-/g, '')}${crypto
      .randomUUID()
      .replace(/-/g, '')
      .substring(0, 16)}`

    const [inserted] = await db
      .insert(apiKey)
      .values({
        name: data.name,
        key: generatedKey,
        userId: data.userId,
      })
      .returning()

    return inserted
  })

export const deleteApiKey = createServerFn({ method: 'POST' })
  .inputValidator(deleteApiKeySchema)
  .handler(async ({ data }) => {
    await db
      .delete(apiKey)
      .where(and(eq(apiKey.id, data.id), eq(apiKey.userId, data.userId)))
  })

export const getApiKeys = createServerFn({ method: 'POST' })
  .inputValidator(getApiKeysSchema)
  .handler(async ({ data }) => {
    return db
      .select()
      .from(apiKey)
      .where(eq(apiKey.userId, data.userId))
      .orderBy(apiKey.createdAt)
  })
