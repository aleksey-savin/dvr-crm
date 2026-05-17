import 'dotenv/config'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { targetActionType } from '@/db/schema'

const TYPES: Array<{ slug: string; name: string }> = [
  { slug: 'client_meeting', name: 'Клиентская встреча' },
  { slug: 'internal_meeting', name: 'Внутренняя встреча' },
  { slug: 'proposal_sent', name: 'Отправка КП' },
  { slug: 'proposal_ready', name: 'Разработка КП' },
  { slug: 'lead_qualification', name: 'Отработка лида / квалификация' },
  { slug: 'meeting_rescheduled', name: 'Перенос встречи' },
  { slug: 'tender_participation', name: 'Участие в тендере' },
]

async function main() {
  for (const t of TYPES) {
    await db
      .insert(targetActionType)
      .values({ slug: t.slug, name: t.name, isSystem: true })
      .onConflictDoUpdate({
        target: targetActionType.slug,
        set: { name: t.name, isSystem: true, deletedAt: sql`NULL` },
      })
    console.log(`✓ ${t.slug}`)
  }
  console.log(`\nSeeded ${TYPES.length} target action types.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
