import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull, lt, ne, sql } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '@/db'
import {
  meeting,
  meetingParticipant,
  meetingExternalParticipant,
  meetingRoom,
  targetAction,
  user,
  department,
  company,
} from '@/db/schema'
import { ensureTargetActionTypeId } from '@/components/target-actions/ensure-type'
import type {
  InitiativeOption,
  MeetingRow,
  MeetingDetail,
  RoomConflict,
  UserOption,
} from '@/types'

const meetingInputSchema = z.object({
  title: z.string().min(1),
  meetingType: z.enum(['client', 'internal']),
  locationType: z.enum(['client_site', 'office']),
  meetingRoomId: z.string().nullable(),
  scheduledAt: z.string(),
  endedAt: z.string().nullable(),
  companyId: z.string().nullable(),
  departmentId: z.string().nullable(),
  organizerId: z.string().nullable(),
  summary: z.string().nullable(),
  accountId: z.string().nullable(),
  leadId: z.string().nullable(),
  tenderId: z.string().nullable(),
  initiativeId: z.string().nullable(),
  participantIds: z.array(z.string()),
  externalParticipants: z.array(
    z.object({
      name: z.string().min(1),
      contactId: z.string().nullable(),
    }),
  ),
})

// ---------------------------------------------------------------------------
// Room booking
// ---------------------------------------------------------------------------
// Бронь переговорки — это сама встреча: запланированная офисная встреча с
// выбранной комнатой занимает слот [scheduledAt, endedAt]. Отмена, перенос или
// удаление встречи автоматически освобождают слот. Если планируемое окончание
// не задано, слот считается часовым.

const DEFAULT_SLOT_MS = 60 * 60 * 1000

function effectiveSlotEnd(scheduledAt: Date, endedAt: Date | null): Date {
  return endedAt && endedAt.getTime() > scheduledAt.getTime()
    ? endedAt
    : new Date(scheduledAt.getTime() + DEFAULT_SLOT_MS)
}

async function findRoomConflicts(opts: {
  roomId: string
  start: Date
  end: Date
  excludeMeetingId?: string
}): Promise<RoomConflict[]> {
  const rows = await db
    .select({
      id: meeting.id,
      title: meeting.title,
      scheduledAt: meeting.scheduledAt,
      endedAt: meeting.endedAt,
    })
    .from(meeting)
    .where(
      and(
        eq(meeting.meetingRoomId, opts.roomId),
        eq(meeting.status, 'scheduled'),
        isNull(meeting.deletedAt),
        lt(meeting.scheduledAt, opts.end),
        sql`COALESCE(${meeting.endedAt}, ${meeting.scheduledAt} + interval '1 hour') > ${opts.start}`,
        ...(opts.excludeMeetingId
          ? [ne(meeting.id, opts.excludeMeetingId)]
          : []),
      ),
    )
    .orderBy(meeting.scheduledAt)

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    scheduledAt: r.scheduledAt,
    endedAt: effectiveSlotEnd(r.scheduledAt, r.endedAt),
  }))
}

const conflictTimeFmt = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

async function assertRoomFree(opts: {
  roomId: string
  start: Date
  end: Date | null
  excludeMeetingId?: string
}) {
  const conflicts = await findRoomConflicts({
    roomId: opts.roomId,
    start: opts.start,
    end: effectiveSlotEnd(opts.start, opts.end),
    excludeMeetingId: opts.excludeMeetingId,
  })
  if (conflicts.length > 0) {
    const first = conflicts[0]
    throw new Error(
      `Переговорка занята: «${first.title}», ${conflictTimeFmt.format(first.scheduledAt)} — ${conflictTimeFmt.format(first.endedAt)}`,
    )
  }
}

export const checkRoomAvailability = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      roomId: z.string(),
      scheduledAt: z.string(),
      endedAt: z.string().nullable(),
      excludeMeetingId: z.string().nullable(),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{ available: boolean; conflicts: RoomConflict[] }> => {
      const start = new Date(data.scheduledAt)
      const conflicts = await findRoomConflicts({
        roomId: data.roomId,
        start,
        end: effectiveSlotEnd(
          start,
          data.endedAt ? new Date(data.endedAt) : null,
        ),
        excludeMeetingId: data.excludeMeetingId ?? undefined,
      })
      return { available: conflicts.length === 0, conflicts }
    },
  )

export const fetchMeetings = createServerFn().handler(
  async (): Promise<MeetingRow[]> => {
    const rows = await db
      .select({
        id: meeting.id,
        title: meeting.title,
        scheduledAt: meeting.scheduledAt,
        endedAt: meeting.endedAt,
        status: meeting.status,
        meetingType: meeting.meetingType,
        locationType: meeting.locationType,
        meetingRoomId: meeting.meetingRoomId,
        meetingRoomName: meetingRoom.name,
        summary: meeting.summary,
        cancelReason: meeting.cancelReason,
        rescheduleCount: meeting.rescheduleCount,
        organizerId: meeting.organizerId,
        organizerName: user.name,
        departmentId: meeting.departmentId,
        departmentName: department.name,
        companyId: meeting.companyId,
        companyName: company.name,
        participantCount: sql<number>`(
          SELECT COUNT(*) FROM meeting_participant mp WHERE mp.meeting_id = ${meeting.id}
        )`,
        createdAt: meeting.createdAt,
      })
      .from(meeting)
      .leftJoin(user, eq(meeting.organizerId, user.id))
      .leftJoin(department, eq(meeting.departmentId, department.id))
      .leftJoin(company, eq(meeting.companyId, company.id))
      .leftJoin(meetingRoom, eq(meeting.meetingRoomId, meetingRoom.id))
      .where(isNull(meeting.deletedAt))
      .orderBy(meeting.scheduledAt)

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      scheduledAt: r.scheduledAt,
      endedAt: r.endedAt,
      status: r.status as MeetingRow['status'],
      meetingType: r.meetingType as MeetingRow['meetingType'],
      locationType: r.locationType as MeetingRow['locationType'],
      meetingRoomId: r.meetingRoomId,
      meetingRoomName: r.meetingRoomName ?? null,
      summary: r.summary,
      cancelReason: r.cancelReason,
      rescheduleCount: r.rescheduleCount,
      organizerId: r.organizerId,
      organizerName: r.organizerName ?? null,
      departmentId: r.departmentId,
      departmentName: r.departmentName ?? null,
      companyId: r.companyId,
      companyName: r.companyName ?? null,
      participantCount: Number(r.participantCount),
      createdAt: r.createdAt,
    }))
  },
)

export const fetchMeeting = createServerFn()
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<MeetingDetail> => {
    const row = await db.query.meeting.findFirst({
      where: and(eq(meeting.id, data.id), isNull(meeting.deletedAt)),
      with: {
        organizer: { columns: { id: true, name: true } },
        department: { columns: { id: true, name: true } },
        company: { columns: { id: true, name: true } },
        meetingRoom: { columns: { id: true, name: true } },
        initiative: { columns: { id: true, title: true } },
        participants: {
          with: { user: { columns: { id: true, name: true } } },
        },
        externalParticipants: {
          columns: { id: true, name: true, contactId: true },
        },
      },
    })
    if (!row) throw new Error('Встреча не найдена')

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(meetingParticipant)
      .where(eq(meetingParticipant.meetingId, row.id))

    return {
      id: row.id,
      title: row.title,
      scheduledAt: row.scheduledAt,
      endedAt: row.endedAt,
      status: row.status as MeetingRow['status'],
      meetingType: row.meetingType as MeetingRow['meetingType'],
      locationType: row.locationType as MeetingRow['locationType'],
      meetingRoomId: row.meetingRoomId,
      meetingRoomName: row.meetingRoom?.name ?? null,
      summary: row.summary,
      cancelReason: row.cancelReason,
      rescheduleCount: row.rescheduleCount,
      organizerId: row.organizerId,
      organizerName: row.organizer?.name ?? null,
      departmentId: row.departmentId,
      departmentName: row.department?.name ?? null,
      companyId: row.companyId,
      companyName: row.company?.name ?? null,
      participantCount: Number(countResult[0]?.count ?? 0),
      createdAt: row.createdAt,
      leadId: row.leadId,
      tenderId: row.tenderId,
      accountId: row.accountId,
      initiativeId: row.initiativeId,
      initiativeTitle: row.initiative?.title ?? null,
      rescheduledFromMeetingId: row.rescheduledFromMeetingId,
      participants: row.participants.map((p) => ({
        userId: p.userId,
        name: p.user.name,
      })),
      externalParticipants: row.externalParticipants.map((ep) => ({
        id: ep.id,
        name: ep.name,
        contactId: ep.contactId,
      })),
    }
  })

export const addMeeting = createServerFn()
  .inputValidator(meetingInputSchema)
  .handler(async ({ data }) => {
    const scheduledDate = new Date(data.scheduledAt)
    const endedDate = data.endedAt ? new Date(data.endedAt) : null
    // Комната имеет смысл только для офисных встреч.
    const meetingRoomId =
      data.locationType === 'office' ? data.meetingRoomId : null

    if (meetingRoomId) {
      await assertRoomFree({
        roomId: meetingRoomId,
        start: scheduledDate,
        end: endedDate,
      })
    }

    const [inserted] = await db
      .insert(meeting)
      .values({
        title: data.title,
        meetingType: data.meetingType,
        locationType: data.locationType,
        meetingRoomId,
        scheduledAt: scheduledDate,
        endedAt: endedDate,
        companyId: data.companyId,
        departmentId: data.departmentId,
        organizerId: data.organizerId,
        summary: data.summary,
        accountId: data.accountId,
        leadId: data.leadId,
        tenderId: data.tenderId,
        initiativeId: data.initiativeId,
        status: 'scheduled',
      })
      .returning({ id: meeting.id })

    if (data.participantIds.length > 0) {
      await db.insert(meetingParticipant).values(
        data.participantIds.map((userId) => ({
          meetingId: inserted.id,
          userId,
        })),
      )
    }

    if (data.externalParticipants.length > 0) {
      await db.insert(meetingExternalParticipant).values(
        data.externalParticipants.map((ep) => ({
          meetingId: inserted.id,
          name: ep.name,
          contactId: ep.contactId,
        })),
      )
    }

    return { id: inserted.id }
  })

export const updateMeeting = createServerFn()
  .inputValidator(meetingInputSchema.extend({ id: z.string() }))
  .handler(async ({ data }) => {
    // NOTE: scheduledAt is intentionally NOT updated here — use rescheduleMeeting
    // to move a meeting (which creates a new record and a meeting_rescheduled
    // target action). Updating other fields (title, participants, etc.) is fine.
    const existing = await db.query.meeting.findFirst({
      where: and(eq(meeting.id, data.id), isNull(meeting.deletedAt)),
      columns: { scheduledAt: true, status: true },
    })
    if (!existing) throw new Error('Встреча не найдена')

    const endedDate = data.endedAt ? new Date(data.endedAt) : null
    const meetingRoomId =
      data.locationType === 'office' ? data.meetingRoomId : null

    if (meetingRoomId && existing.status === 'scheduled') {
      await assertRoomFree({
        roomId: meetingRoomId,
        start: existing.scheduledAt,
        end: endedDate,
        excludeMeetingId: data.id,
      })
    }

    await db
      .update(meeting)
      .set({
        title: data.title,
        meetingType: data.meetingType,
        locationType: data.locationType,
        meetingRoomId,
        endedAt: endedDate,
        companyId: data.companyId,
        departmentId: data.departmentId,
        organizerId: data.organizerId,
        summary: data.summary,
        accountId: data.accountId,
        leadId: data.leadId,
        tenderId: data.tenderId,
        initiativeId: data.initiativeId,
      })
      .where(eq(meeting.id, data.id))

    await db
      .delete(meetingParticipant)
      .where(eq(meetingParticipant.meetingId, data.id))
    if (data.participantIds.length > 0) {
      await db.insert(meetingParticipant).values(
        data.participantIds.map((userId) => ({
          meetingId: data.id,
          userId,
        })),
      )
    }

    await db
      .delete(meetingExternalParticipant)
      .where(eq(meetingExternalParticipant.meetingId, data.id))
    if (data.externalParticipants.length > 0) {
      await db.insert(meetingExternalParticipant).values(
        data.externalParticipants.map((ep) => ({
          meetingId: data.id,
          name: ep.name,
          contactId: ep.contactId,
        })),
      )
    }
  })

export const completeMeeting = createServerFn()
  .inputValidator(z.object({ id: z.string(), summary: z.string().nullable() }))
  .handler(async ({ data }) => {
    const now = new Date()

    const updatedRows = await db
      .update(meeting)
      .set({ status: 'completed', endedAt: now, summary: data.summary })
      .where(eq(meeting.id, data.id))
      .returning()
    const updated = updatedRows.at(0)
    if (!updated) throw new Error('Встреча не найдена')

    const slug =
      updated.meetingType === 'client' ? 'client_meeting' : 'internal_meeting'
    const typeId = await ensureTargetActionTypeId(slug)
    const plannedAt = (updated.endedAt ?? now).toISOString().split('T')[0]
    await db.insert(targetAction).values({
      typeId,
      responsibleUserId: updated.organizerId,
      departmentId: updated.departmentId,
      plannedAt,
      completedAt: updated.endedAt ?? now,
      status: 'completed',
      sourceType: 'meeting',
      sourceId: updated.id,
      accountId: updated.accountId,
      leadId: updated.leadId,
      tenderId: updated.tenderId,
      initiativeId: updated.initiativeId,
    })
  })

export const cancelMeeting = createServerFn()
  .inputValidator(
    z.object({
      id: z.string(),
      reason: z.string().min(1, 'Причина обязательна'),
    }),
  )
  .handler(async ({ data }) => {
    await db
      .update(meeting)
      .set({ status: 'cancelled', cancelReason: data.reason })
      .where(eq(meeting.id, data.id))
  })

export const rescheduleMeeting = createServerFn()
  .inputValidator(
    z.object({
      id: z.string(),
      newScheduledAt: z.string(),
      reason: z.string().min(1, 'Причина обязательна'),
    }),
  )
  .handler(async ({ data }) => {
    const existing = await db.query.meeting.findFirst({
      where: and(eq(meeting.id, data.id), isNull(meeting.deletedAt)),
    })
    if (!existing) throw new Error('Встреча не найдена')

    const newDate = new Date(data.newScheduledAt)

    // Keep the planned duration (and therefore the booked slot length) when
    // the original meeting had a planned end.
    const plannedDurationMs =
      existing.endedAt &&
      existing.endedAt.getTime() > existing.scheduledAt.getTime()
        ? existing.endedAt.getTime() - existing.scheduledAt.getTime()
        : null
    const newEndedAt = plannedDurationMs
      ? new Date(newDate.getTime() + plannedDurationMs)
      : null

    if (existing.meetingRoomId) {
      await assertRoomFree({
        roomId: existing.meetingRoomId,
        start: newDate,
        end: newEndedAt,
        excludeMeetingId: existing.id,
      })
    }

    // Перенос двигает даты самой встречи — без записи-дубликата. Пометка о
    // переносе: счётчик rescheduleCount (бейдж в UI) и целевое действие.
    await db
      .update(meeting)
      .set({
        scheduledAt: newDate,
        endedAt: newEndedAt,
        rescheduleCount: sql`${meeting.rescheduleCount} + 1`,
      })
      .where(eq(meeting.id, data.id))

    const typeId = await ensureTargetActionTypeId('meeting_rescheduled')
    const now = new Date()
    await db.insert(targetAction).values({
      typeId,
      responsibleUserId: existing.organizerId,
      departmentId: existing.departmentId,
      plannedAt: now.toISOString().split('T')[0],
      completedAt: now,
      status: 'completed',
      reason: data.reason,
      sourceType: 'meeting',
      sourceId: existing.id,
      accountId: existing.accountId,
      leadId: existing.leadId,
      tenderId: existing.tenderId,
      initiativeId: existing.initiativeId,
    })

    return { id: existing.id }
  })

export const softDeleteMeeting = createServerFn()
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .update(meeting)
      .set({ deletedAt: new Date() })
      .where(eq(meeting.id, data.id))
  })

export const fetchCompanies = createServerFn().handler(async () => {
  return db.query.company.findMany({
    columns: { id: true, name: true },
    orderBy: (c, { asc }) => [asc(c.name)],
  })
})

export const fetchDepartments = createServerFn().handler(async () => {
  return db.query.department.findMany({
    columns: { id: true, name: true },
    orderBy: (d, { asc }) => [asc(d.name)],
  })
})

export const fetchUsers = createServerFn().handler(
  async (): Promise<UserOption[]> => {
    return db.query.user.findMany({
      columns: { id: true, name: true, departmentId: true },
      where: (u, { eq }) => eq(u.banned, false),
      orderBy: (u, { asc }) => [asc(u.name)],
    })
  },
)

export const fetchInitiatives = createServerFn().handler(
  async (): Promise<InitiativeOption[]> => {
    return db.query.initiative.findMany({
      columns: {
        id: true,
        title: true,
        companyId: true,
        departmentId: true,
        responsibleUserId: true,
      },
      where: (i, { isNull }) => isNull(i.deletedAt),
      orderBy: (i, { desc }) => [desc(i.createdAt)],
    })
  },
)

export const fetchMeetingsByInitiative = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ initiativeId: z.string() }))
  .handler(async ({ data }): Promise<MeetingRow[]> => {
    const rows = await db
      .select({
        id: meeting.id,
        title: meeting.title,
        scheduledAt: meeting.scheduledAt,
        endedAt: meeting.endedAt,
        status: meeting.status,
        meetingType: meeting.meetingType,
        locationType: meeting.locationType,
        meetingRoomId: meeting.meetingRoomId,
        meetingRoomName: meetingRoom.name,
        summary: meeting.summary,
        cancelReason: meeting.cancelReason,
        rescheduleCount: meeting.rescheduleCount,
        organizerId: meeting.organizerId,
        organizerName: user.name,
        departmentId: meeting.departmentId,
        departmentName: department.name,
        companyId: meeting.companyId,
        companyName: company.name,
        participantCount: sql<number>`(
          SELECT COUNT(*) FROM meeting_participant mp WHERE mp.meeting_id = ${meeting.id}
        )`,
        createdAt: meeting.createdAt,
      })
      .from(meeting)
      .leftJoin(user, eq(meeting.organizerId, user.id))
      .leftJoin(department, eq(meeting.departmentId, department.id))
      .leftJoin(company, eq(meeting.companyId, company.id))
      .leftJoin(meetingRoom, eq(meeting.meetingRoomId, meetingRoom.id))
      .where(
        and(
          isNull(meeting.deletedAt),
          eq(meeting.initiativeId, data.initiativeId),
        ),
      )
      .orderBy(meeting.scheduledAt)

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      scheduledAt: r.scheduledAt,
      endedAt: r.endedAt,
      status: r.status as MeetingRow['status'],
      meetingType: r.meetingType as MeetingRow['meetingType'],
      locationType: r.locationType as MeetingRow['locationType'],
      meetingRoomId: r.meetingRoomId,
      meetingRoomName: r.meetingRoomName ?? null,
      summary: r.summary,
      cancelReason: r.cancelReason,
      rescheduleCount: r.rescheduleCount,
      organizerId: r.organizerId,
      organizerName: r.organizerName ?? null,
      departmentId: r.departmentId,
      departmentName: r.departmentName ?? null,
      companyId: r.companyId,
      companyName: r.companyName ?? null,
      participantCount: Number(r.participantCount),
      createdAt: r.createdAt,
    }))
  })
