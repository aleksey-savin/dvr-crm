import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { asc, eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '@/db'
import { meeting, meetingRoom } from '@/db/schema'

const meetingRoomSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
})

const updateMeetingRoomSchema = meetingRoomSchema.extend({
  id: z.string(),
})

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  )
}

export const fetchMeetingRooms = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db.query.meetingRoom.findMany({
      orderBy: [asc(meetingRoom.name)],
    })
  },
)

export const fetchMeetingRoom = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.meetingRoom.findFirst({
      where: eq(meetingRoom.id, data.id),
    })

    if (!row) throw notFound()
    return row
  })

export const addMeetingRoom = createServerFn({ method: 'POST' })
  .inputValidator(meetingRoomSchema)
  .handler(async ({ data }) => {
    try {
      const [inserted] = await db
        .insert(meetingRoom)
        .values({ name: data.name.trim() })
        .returning({ id: meetingRoom.id })

      return inserted.id
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new Error('Переговорка с таким названием уже существует')
      }
      throw error
    }
  })

export const updateMeetingRoom = createServerFn({ method: 'POST' })
  .inputValidator(updateMeetingRoomSchema)
  .handler(async ({ data }) => {
    try {
      await db
        .update(meetingRoom)
        .set({ name: data.name.trim() })
        .where(eq(meetingRoom.id, data.id))
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new Error('Переговорка с таким названием уже существует')
      }
      throw error
    }
  })

export const deleteMeetingRoom = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    await db.transaction(async (tx) => {
      await tx
        .update(meeting)
        .set({ meetingRoomId: null })
        .where(eq(meeting.meetingRoomId, id))

      await tx.delete(meetingRoom).where(eq(meetingRoom.id, id))
    })
  })
