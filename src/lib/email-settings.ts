import { db } from '@/db'
import { emailSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const EMAIL_SETTINGS_ID = 'default'

/**
 * Returns the singleton email-settings row, creating it with defaults on first
 * access. Mirrors ensureClientClassificationSettings so the SMTP config tab
 * always has a row to read/update.
 */
export async function ensureEmailSettings() {
  const existing = await db
    .select()
    .from(emailSettings)
    .where(eq(emailSettings.id, EMAIL_SETTINGS_ID))
    .limit(1)

  if (existing[0]) return existing[0]

  const inserted = await db
    .insert(emailSettings)
    .values({ id: EMAIL_SETTINGS_ID })
    .onConflictDoNothing()
    .returning()

  if (inserted[0]) return inserted[0]

  const createdByAnotherRequest = await db
    .select()
    .from(emailSettings)
    .where(eq(emailSettings.id, EMAIL_SETTINGS_ID))
    .limit(1)
    .then((rows) => rows.at(0))

  if (!createdByAnotherRequest) {
    throw new Error('Не удалось создать настройки уведомлений')
  }

  return createdByAnotherRequest
}
