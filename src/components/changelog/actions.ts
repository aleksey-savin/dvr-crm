import { db } from '@/db'
import { changelogRelease } from '@/db/schema'
import type { ChangelogReleaseRow } from '@/types'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { auth } from 'utils/auth'
import * as z from 'zod'

const changelogStatusSchema = z.enum(['draft', 'published'])

const changelogInputSchema = z.object({
  version: z.string().trim().min(1, 'Укажите версию').max(40),
  title: z.string().trim().min(2, 'Заголовок слишком короткий').max(160),
  summary: z.string().trim().max(500).optional(),
  content: z.string().trim().min(1, 'Добавьте список изменений'),
  status: changelogStatusSchema,
  publishedAt: z.string().optional(),
})

const updateChangelogSchema = changelogInputSchema.extend({
  id: z.string(),
})

function isChangelogEditor(role: string | null | undefined) {
  return role === 'admin' || role === 'manager'
}

async function getSession() {
  const request = getRequest()
  return auth.api.getSession({ headers: request.headers })
}

async function requireChangelogEditor() {
  const session = await getSession()

  if (!isChangelogEditor(session?.user.role)) {
    throw new Error('Недостаточно прав для управления changelog')
  }

  return session
}

function resolvePublishedAt(
  status: z.infer<typeof changelogStatusSchema>,
  value?: string,
) {
  if (status === 'draft') return null
  if (!value) return new Date()

  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function getReleaseTime(row: { publishedAt: Date | null; createdAt: Date }) {
  return (row.publishedAt ?? row.createdAt).getTime()
}

function toChangelogReleaseRow(
  row: typeof changelogRelease.$inferSelect & {
    author?: { name: string } | null
  },
): ChangelogReleaseRow {
  return {
    id: row.id,
    version: row.version,
    title: row.title,
    summary: row.summary,
    content: row.content,
    status: row.status,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    authorName: row.author?.name ?? null,
  }
}

export const fetchChangelogPage = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getSession()
    const canManage = isChangelogEditor(session?.user.role)

    const rows = await db.query.changelogRelease.findMany({
      ...(canManage ? {} : { where: eq(changelogRelease.status, 'published') }),
      with: {
        author: {
          columns: { name: true },
        },
      },
    })

    const releases = rows
      .sort((a, b) => getReleaseTime(b) - getReleaseTime(a))
      .map(toChangelogReleaseRow)

    return { releases, canManage }
  },
)

export const ensureCanManageChangelog = createServerFn({
  method: 'GET',
}).handler(async () => {
  await requireChangelogEditor()
  return true
})

export const fetchLatestPublishedRelease = createServerFn({
  method: 'GET',
}).handler(async () => {
  const rows = await db.query.changelogRelease.findMany({
    where: eq(changelogRelease.status, 'published'),
    with: {
      author: {
        columns: { name: true },
      },
    },
  })

  return (
    rows
      .sort((a, b) => getReleaseTime(b) - getReleaseTime(a))
      .map(toChangelogReleaseRow)
      .at(0) ?? null
  )
})

export const fetchChangelogRelease = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await requireChangelogEditor()

    const release = await db.query.changelogRelease.findFirst({
      where: eq(changelogRelease.id, data.id),
      with: {
        author: {
          columns: { name: true },
        },
      },
    })

    if (!release) throw new Error('Релиз не найден')
    return toChangelogReleaseRow(release)
  })

export const addChangelogRelease = createServerFn({ method: 'POST' })
  .inputValidator(changelogInputSchema)
  .handler(async ({ data }) => {
    const session = await requireChangelogEditor()

    await db.insert(changelogRelease).values({
      version: data.version,
      title: data.title,
      summary: data.summary || null,
      content: data.content,
      status: data.status,
      publishedAt: resolvePublishedAt(data.status, data.publishedAt),
      authorId: session.user.id,
    })
  })

export const updateChangelogRelease = createServerFn({ method: 'POST' })
  .inputValidator(updateChangelogSchema)
  .handler(async ({ data }) => {
    await requireChangelogEditor()

    await db
      .update(changelogRelease)
      .set({
        version: data.version,
        title: data.title,
        summary: data.summary || null,
        content: data.content,
        status: data.status,
        publishedAt: resolvePublishedAt(data.status, data.publishedAt),
      })
      .where(eq(changelogRelease.id, data.id))
  })

export const deleteChangelogRelease = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    await requireChangelogEditor()
    await db.delete(changelogRelease).where(eq(changelogRelease.id, id))
  })
