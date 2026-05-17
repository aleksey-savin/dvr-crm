import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull, sql } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '@/db'
import {
  meeting,
  meetingParticipant,
  meetingExternalParticipant,
  targetAction,
  targetActionType,
  user,
  department,
  company,
} from '@/db/schema'
import type { MeetingRow, MeetingDetail } from '@/types'

async function getTargetActionTypeId(slug: string): Promise<string | null> {
  const type = await db.query.targetActionType.findFirst({
    where: and(
      eq(targetActionType.slug, slug),
      isNull(targetActionType.deletedAt),
    ),
  })
  if (!type) {
    console.warn(
      `[target-action] type with slug "${slug}" not found — skipping insert. Run pnpm db:seed:target-action-types.`,
    )
    return null
  }
  return type.id
}

const meetingInputSchema = z.object({
  title: z.string().min(1),
  meetingType: z.enum(['client', 'internal']),
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
        summary: meeting.summary,
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
      .where(isNull(meeting.deletedAt))
      .orderBy(meeting.scheduledAt)

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      scheduledAt: r.scheduledAt,
      endedAt: r.endedAt,
      status: r.status as MeetingRow['status'],
      meetingType: r.meetingType as MeetingRow['meetingType'],
      summary: r.summary,
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
      summary: row.summary,
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

    const [inserted] = await db
      .insert(meeting)
      .values({
        title: data.title,
        meetingType: data.meetingType,
        scheduledAt: scheduledDate,
        endedAt: data.endedAt ? new Date(data.endedAt) : null,
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
    await db
      .update(meeting)
      .set({
        title: data.title,
        meetingType: data.meetingType,
        endedAt: data.endedAt ? new Date(data.endedAt) : null,
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
  .inputValidator(
    z.object({ id: z.string(), summary: z.string().nullable() }),
  )
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
    const typeId = await getTargetActionTypeId(slug)
    if (typeId) {
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
    }
  })

export const cancelMeeting = createServerFn()
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .update(meeting)
      .set({ status: 'cancelled' })
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
      with: {
        participants: { columns: { userId: true } },
        externalParticipants: {
          columns: { name: true, contactId: true },
        },
      },
    })
    if (!existing) throw new Error('Встреча не найдена')

    const newDate = new Date(data.newScheduledAt)

    // 1. Mark the old meeting as rescheduled.
    await db
      .update(meeting)
      .set({ status: 'rescheduled' })
      .where(eq(meeting.id, data.id))

    // 2. Create a new meeting record copying the relevant fields.
    const [created] = await db
      .insert(meeting)
      .values({
        title: existing.title,
        meetingType: existing.meetingType,
        scheduledAt: newDate,
        endedAt: null,
        companyId: existing.companyId,
        departmentId: existing.departmentId,
        organizerId: existing.organizerId,
        summary: null,
        accountId: existing.accountId,
        leadId: existing.leadId,
        tenderId: existing.tenderId,
        initiativeId: existing.initiativeId,
        rescheduledFromMeetingId: existing.id,
        status: 'scheduled',
      })
      .returning({ id: meeting.id })

    if (existing.participants.length > 0) {
      await db.insert(meetingParticipant).values(
        existing.participants.map((p) => ({
          meetingId: created.id,
          userId: p.userId,
        })),
      )
    }
    if (existing.externalParticipants.length > 0) {
      await db.insert(meetingExternalParticipant).values(
        existing.externalParticipants.map((ep) => ({
          meetingId: created.id,
          name: ep.name,
          contactId: ep.contactId,
        })),
      )
    }

    // 3. Record a target action for the reschedule itself.
    const typeId = await getTargetActionTypeId('meeting_rescheduled')
    if (typeId) {
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
        sourceId: created.id,
        accountId: existing.accountId,
        leadId: existing.leadId,
        tenderId: existing.tenderId,
        initiativeId: existing.initiativeId,
      })
    }

    return { id: created.id }
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

export const fetchUsers = createServerFn().handler(async () => {
  return db.query.user.findMany({
    columns: { id: true, name: true },
    where: (u, { eq }) => eq(u.banned, false),
    orderBy: (u, { asc }) => [asc(u.name)],
  })
})

export const fetchInitiatives = createServerFn().handler(async () => {
  return db.query.initiative.findMany({
    columns: { id: true, title: true },
    where: (i, { isNull }) => isNull(i.deletedAt),
    orderBy: (i, { desc }) => [desc(i.createdAt)],
  })
})

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
        summary: meeting.summary,
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
      summary: r.summary,
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
