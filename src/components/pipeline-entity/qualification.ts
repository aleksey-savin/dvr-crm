import { db } from '@/db'
import { targetAction, targetActionType, user } from '@/db/schema'
import { getRequest } from '@tanstack/react-start/server'
import { and, eq, isNull } from 'drizzle-orm'
import { auth } from 'utils/auth'
import type { EntityType } from '@/types'

async function getSessionUserId(): Promise<string | null> {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return null
  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { id: true },
  })
  return dbUser?.id ?? null
}

/**
 * Records a completed "{entityType}_qualification" target action as a system
 * fact when a lead/tender/signal is qualified (rejected or converted).
 * No-op with a warning if the matching type slug isn't seeded.
 */
export async function recordQualification(opts: {
  entityType: EntityType
  entityId: string
  departmentId: string | null
  responsibleUserId: string | null
  initiativeId?: string | null
}) {
  const slug = `${opts.entityType}_qualification`
  const type = await db.query.targetActionType.findFirst({
    where: and(
      eq(targetActionType.slug, slug),
      isNull(targetActionType.deletedAt),
    ),
  })
  if (!type) {
    console.warn(`[target-action] type "${slug}" not found — skipping.`)
    return
  }

  const currentUserId = await getSessionUserId()
  const now = new Date()
  await db.insert(targetAction).values({
    typeId: type.id,
    responsibleUserId: currentUserId ?? opts.responsibleUserId,
    departmentId: opts.departmentId,
    plannedAt: now.toISOString().split('T')[0],
    completedAt: now,
    status: 'completed',
    sourceType: opts.entityType,
    sourceId: opts.entityId,
    leadId: opts.entityType === 'lead' ? opts.entityId : undefined,
    tenderId: opts.entityType === 'tender' ? opts.entityId : undefined,
    signalId: opts.entityType === 'signal' ? opts.entityId : undefined,
    initiativeId: opts.initiativeId ?? undefined,
  })
}
