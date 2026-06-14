import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { targetAction, targetActionType } from '@/db/schema'
import { ensureTargetActionTypeId } from '@/components/target-actions/ensure-type'

/**
 * One-off, idempotent cleanup for a duplicated system target-action type:
 * an orphan slug `meeting_reschedule` (без `d`) lingered in the DB from an
 * earlier code version, while the code now consistently uses `meeting_rescheduled`.
 *
 * Repoints every target_action referencing the orphan to the canonical type,
 * then removes the orphan. No-op when the orphan is absent. Safe to re-run.
 */

const ORPHAN_SLUG = 'meeting_reschedule'
const CANONICAL_SLUG = 'meeting_rescheduled'

async function main() {
  const orphan = (
    await db
      .select({ id: targetActionType.id })
      .from(targetActionType)
      .where(eq(targetActionType.slug, ORPHAN_SLUG))
      .limit(1)
  ).at(0)

  if (!orphan) {
    console.log(`✓ Нет дубля «${ORPHAN_SLUG}» — ничего делать не нужно.`)
    process.exit(0)
  }

  const canonicalId = await ensureTargetActionTypeId(CANONICAL_SLUG)

  if (canonicalId === orphan.id) {
    console.log('✓ Канонический тип совпадает с найденным — пропуск.')
    process.exit(0)
  }

  const repointed = await db
    .update(targetAction)
    .set({ typeId: canonicalId })
    .where(eq(targetAction.typeId, orphan.id))
    .returning({ id: targetAction.id })

  await db.delete(targetActionType).where(eq(targetActionType.id, orphan.id))

  console.log(
    `✓ Перепривязано целевых действий: ${repointed.length}; осиротевший тип «${ORPHAN_SLUG}» удалён.`,
  )
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
