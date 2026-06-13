import { db } from '@/db'
import { targetActionType } from '@/db/schema'

/** Имена системных типов — как в scripts/seed-target-action-types.ts. */
const SLUG_NAMES: Record<string, string> = {
  client_meeting: 'Клиентская встреча',
  internal_meeting: 'Внутренняя встреча',
  proposal_sent: 'Отправка КП',
  proposal_ready: 'Разработка КП',
  lead_qualification: 'Отработка лида / квалификация',
  signal_qualification: 'Отработка сигнала / квалификация',
  tender_qualification: 'Отработка тендера / квалификация',
  meeting_rescheduled: 'Перенос встречи',
  tender_participation: 'Участие в тендере',
}

/**
 * Id типа целевого действия по слагу. Создаёт запись (или восстанавливает
 * soft-deleted, не перетирая пользовательское имя), чтобы фиксация целевого
 * действия не пропадала молча из-за непрогнанного сида или удалённого типа.
 */
export async function ensureTargetActionTypeId(slug: string): Promise<string> {
  const [row] = await db
    .insert(targetActionType)
    .values({ slug, name: SLUG_NAMES[slug] ?? slug, isSystem: true })
    .onConflictDoUpdate({
      target: targetActionType.slug,
      set: { deletedAt: null },
    })
    .returning({ id: targetActionType.id })
  return row.id
}
