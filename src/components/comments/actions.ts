import { db } from '@/db'
import { comment, commentRead } from '@/db/schema'
import { recalculateClientClassifications } from '@/lib/client-classification'
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

export const fetchComments = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ entityType: z.string(), entityId: z.string() }))
  .handler(async ({ data }) => {
    return db.query.comment.findMany({
      where: (commentTable, { and, eq }) =>
        and(
          eq(commentTable.entityType, data.entityType),
          eq(commentTable.entityId, data.entityId),
        ),
      with: {
        author: { columns: { id: true, name: true, image: true } },
        attachments: true,
        reads: { columns: { userId: true, readAt: true, commentId: true } },
      },
      orderBy: (commentTable, { asc }) => [asc(commentTable.createdAt)],
    })
  })

export const addComment = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      entityType: z.string(),
      entityId: z.string(),
      content: z.string().min(1, 'Комментарий не может быть пустым'),
      authorId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(comment)
      .values({
        content: data.content,
        entityType: data.entityType,
        entityId: data.entityId,
        authorId: data.authorId,
      })
      .returning()

    if (data.entityType === 'companyAccount') {
      await recalculateClientClassifications([data.entityId])
    }

    return inserted
  })

export const markCommentsRead = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      commentIds: z.array(z.string()),
      userId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    if (data.commentIds.length === 0) return

    await db
      .insert(commentRead)
      .values(
        data.commentIds.map((id) => ({
          commentId: id,
          userId: data.userId,
        })),
      )
      .onConflictDoNothing()
  })
