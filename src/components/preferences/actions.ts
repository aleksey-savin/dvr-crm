import { db } from '@/db'
import {
  apiKey,
  clientClassificationSettings,
  emailSettings,
} from '@/db/schema'
import {
  CLIENT_CLASSIFICATION_SETTINGS_ID,
  ensureClientClassificationSettings,
  recalculateClientClassifications,
} from '@/lib/client-classification'
import { EMAIL_SETTINGS_ID, ensureEmailSettings } from '@/lib/email-settings'
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

const clientClassificationSettingsSchema = z.object({
  targetGrossProfitThreshold: z
    .string()
    .trim()
    .min(1, 'Укажите порог валовой прибыли')
    .regex(/^\d+([.,]\d{1,2})?$/, 'Введите положительное число'),
  lostActivityYears: z
    .number()
    .int('Период должен быть целым числом')
    .min(1, 'Минимум 1 год')
    .max(20, 'Максимум 20 лет'),
  userId: z.string().optional(),
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

export const getClientClassificationSettings = createServerFn({
  method: 'GET',
}).handler(async () => {
  return ensureClientClassificationSettings()
})

export const updateClientClassificationSettings = createServerFn({
  method: 'POST',
})
  .inputValidator(clientClassificationSettingsSchema)
  .handler(async ({ data }) => {
    const targetGrossProfitThreshold = data.targetGrossProfitThreshold.replace(
      ',',
      '.',
    )

    const [settings] = await db
      .insert(clientClassificationSettings)
      .values({
        id: CLIENT_CLASSIFICATION_SETTINGS_ID,
        targetGrossProfitThreshold,
        lostActivityYears: data.lostActivityYears,
        updatedByUserId: data.userId ?? null,
      })
      .onConflictDoUpdate({
        target: clientClassificationSettings.id,
        set: {
          targetGrossProfitThreshold,
          lostActivityYears: data.lostActivityYears,
          updatedByUserId: data.userId ?? null,
          updatedAt: new Date(),
        },
      })
      .returning()

    const recalculation = await recalculateClientClassifications(undefined, {
      targetGrossProfitThreshold,
      lostActivityYears: data.lostActivityYears,
    })

    return { settings, recalculation }
  })

const emailSettingsSchema = z.object({
  enabled: z.boolean(),
  host: z.string().trim().optional(),
  port: z.number().int().min(1).max(65535).nullable().optional(),
  secure: z.enum(['none', 'ssl_tls', 'starttls']),
  username: z.string().trim().optional(),
  // Empty string means "keep the stored password".
  password: z.string().optional(),
  fromEmail: z.string().trim().optional(),
  userId: z.string().optional(),
})

export const getEmailSettings = createServerFn({ method: 'GET' }).handler(
  async () => {
    return ensureEmailSettings()
  },
)

export const updateEmailSettings = createServerFn({ method: 'POST' })
  .inputValidator(emailSettingsSchema)
  .handler(async ({ data }) => {
    const base = {
      enabled: data.enabled,
      host: data.host || null,
      port: data.port ?? null,
      secure: data.secure,
      username: data.username || null,
      fromEmail: data.fromEmail || null,
      updatedByUserId: data.userId ?? null,
    }

    const [settings] = await db
      .insert(emailSettings)
      .values({
        id: EMAIL_SETTINGS_ID,
        ...base,
        password: data.password || null,
      })
      .onConflictDoUpdate({
        target: emailSettings.id,
        set: data.password
          ? { ...base, password: data.password, updatedAt: new Date() }
          : { ...base, updatedAt: new Date() },
      })
      .returning()

    return settings
  })
