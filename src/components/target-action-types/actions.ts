import { createServerFn } from '@tanstack/react-start'
import { and, isNull, eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '@/db'
import { targetActionType } from '@/db/schema'
import type { TargetActionTypeRow } from '@/types'

export const fetchTargetActionTypes = createServerFn().handler(
  async (): Promise<TargetActionTypeRow[]> => {
    const rows = await db.query.targetActionType.findMany({
      where: isNull(targetActionType.deletedAt),
      orderBy: (t, { asc }) => [asc(t.isSystem), asc(t.name)],
    })
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      isSystem: r.isSystem,
      isPlannable: r.isPlannable,
      createdAt: r.createdAt,
    }))
  },
)

export const addTargetActionType = createServerFn()
  .inputValidator(
    z.object({
      name: z.string().min(1),
      isPlannable: z.boolean().default(true),
    }),
  )
  .handler(async ({ data }) => {
    const slug = data.name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
    await db.insert(targetActionType).values({
      name: data.name,
      slug,
      isSystem: false,
      isPlannable: data.isPlannable,
    })
  })

export const updateTargetActionType = createServerFn()
  .inputValidator(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      isPlannable: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    await db
      .update(targetActionType)
      .set({ name: data.name, isPlannable: data.isPlannable })
      .where(
        and(
          eq(targetActionType.id, data.id),
          isNull(targetActionType.deletedAt),
        ),
      )
  })

export const softDeleteTargetActionType = createServerFn()
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const type = await db.query.targetActionType.findFirst({
      where: eq(targetActionType.id, data.id),
    })
    if (!type) throw new Error('Тип ЦД не найден')
    if (type.isSystem) throw new Error('Системные типы нельзя удалить')
    await db
      .update(targetActionType)
      .set({ deletedAt: new Date() })
      .where(eq(targetActionType.id, data.id))
  })
