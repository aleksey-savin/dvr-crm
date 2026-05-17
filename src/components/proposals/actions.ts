import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { notFound } from '@tanstack/react-router'
import { and, asc, eq, isNull, ne } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '@/db'
import {
  proposal,
  initiative,
  user,
  targetAction,
  targetActionType,
} from '@/db/schema'
import { auth } from 'utils/auth'
import type { ProposalRow } from '@/types'

async function getCurrentUserId(): Promise<string | null> {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  return session?.user.id ?? null
}

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

const PROPOSAL_SELECT = {
  id: proposal.id,
  initiativeId: proposal.initiativeId,
  initiativeTitle: initiative.title,
  title: proposal.title,
  version: proposal.version,
  status: proposal.status,
  proposalType: proposal.proposalType,
  amount: proposal.amount,
  validUntil: proposal.validUntil,
  isCurrent: proposal.isCurrent,
  description: proposal.description,
  senderUserId: proposal.senderUserId,
  senderUserName: user.name,
  preparedAt: proposal.preparedAt,
  sentAt: proposal.sentAt,
  createdAt: proposal.createdAt,
  updatedAt: proposal.updatedAt,
} as const

type RawRow = {
  id: string
  initiativeId: string
  initiativeTitle: string | null
  title: string
  version: number
  status: string
  proposalType: string | null
  amount: string | null
  validUntil: string | null
  isCurrent: boolean
  description: string | null
  senderUserId: string | null
  senderUserName: string | null
  preparedAt: Date | null
  sentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

function mapRow(r: RawRow): ProposalRow {
  return {
    id: r.id,
    initiativeId: r.initiativeId,
    initiativeTitle: r.initiativeTitle,
    title: r.title,
    version: r.version,
    status: r.status as ProposalRow['status'],
    proposalType: r.proposalType as ProposalRow['proposalType'],
    amount: r.amount,
    validUntil: r.validUntil,
    isCurrent: r.isCurrent,
    description: r.description,
    senderUserId: r.senderUserId,
    senderUserName: r.senderUserName,
    preparedAt: r.preparedAt,
    sentAt: r.sentAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

export const fetchProposalsByInitiative = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ initiativeId: z.string() }))
  .handler(async ({ data }): Promise<ProposalRow[]> => {
    const rows = await db
      .select(PROPOSAL_SELECT)
      .from(proposal)
      .leftJoin(initiative, eq(proposal.initiativeId, initiative.id))
      .leftJoin(user, eq(proposal.senderUserId, user.id))
      .where(
        and(
          isNull(proposal.deletedAt),
          eq(proposal.initiativeId, data.initiativeId),
        ),
      )
      .orderBy(asc(proposal.version))

    return rows.map(mapRow)
  })

export const fetchProposal = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<ProposalRow> => {
    const rows = await db
      .select(PROPOSAL_SELECT)
      .from(proposal)
      .leftJoin(initiative, eq(proposal.initiativeId, initiative.id))
      .leftJoin(user, eq(proposal.senderUserId, user.id))
      .where(and(isNull(proposal.deletedAt), eq(proposal.id, data.id)))
      .limit(1)
    const row = rows.at(0)
    if (!row) throw notFound()
    return mapRow(row)
  })

const proposalInputSchema = z.object({
  initiativeId: z.string().min(1),
  title: z.string().min(1, 'Название обязательно'),
  amount: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  proposalType: z.enum(['initial', 'revised', 'final']).nullable().optional(),
})

export const addProposal = createServerFn({ method: 'POST' })
  .inputValidator(proposalInputSchema)
  .handler(async ({ data }) => {
    // Next version is max(version) + 1 within the initiative.
    const existing = await db.query.proposal.findMany({
      where: and(
        eq(proposal.initiativeId, data.initiativeId),
        isNull(proposal.deletedAt),
      ),
      columns: { version: true },
    })
    const nextVersion =
      existing.reduce((max, p) => Math.max(max, p.version), 0) + 1

    const [inserted] = await db
      .insert(proposal)
      .values({
        initiativeId: data.initiativeId,
        title: data.title,
        version: nextVersion,
        amount: data.amount ?? null,
        validUntil: data.validUntil ?? null,
        description: data.description ?? null,
        proposalType: data.proposalType ?? null,
        status: 'draft',
        isCurrent: false,
      })
      .returning({ id: proposal.id })

    return { id: inserted.id }
  })

export const updateProposal = createServerFn({ method: 'POST' })
  .inputValidator(proposalInputSchema.extend({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .update(proposal)
      .set({
        title: data.title,
        amount: data.amount ?? null,
        validUntil: data.validUntil ?? null,
        description: data.description ?? null,
        proposalType: data.proposalType ?? null,
      })
      .where(eq(proposal.id, data.id))
  })

export const prepareProposal = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const now = new Date()

    const preparedRows = await db
      .update(proposal)
      .set({ status: 'prepared', preparedAt: now })
      .where(and(eq(proposal.id, data.id), isNull(proposal.deletedAt)))
      .returning()
    const updated = preparedRows.at(0)
    if (!updated) throw notFound()

    const typeId = await getTargetActionTypeId('proposal_ready')
    if (typeId) {
      const initiativeRow = await db.query.initiative.findFirst({
        where: eq(initiative.id, updated.initiativeId),
        columns: { departmentId: true, responsibleUserId: true },
      })
      const currentUserId = await getCurrentUserId()
      await db.insert(targetAction).values({
        typeId,
        responsibleUserId:
          currentUserId ?? initiativeRow?.responsibleUserId ?? null,
        departmentId: initiativeRow?.departmentId ?? null,
        plannedAt: now.toISOString().split('T')[0],
        completedAt: now,
        status: 'completed',
        sourceType: 'proposal',
        sourceId: updated.id,
        initiativeId: updated.initiativeId,
        proposalId: updated.id,
      })
    }
  })

export const sendProposal = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const now = new Date()
    const currentUserId = await getCurrentUserId()

    const sentRows = await db
      .update(proposal)
      .set({
        status: 'sent',
        sentAt: now,
        senderUserId: currentUserId,
        isCurrent: true,
      })
      .where(and(eq(proposal.id, data.id), isNull(proposal.deletedAt)))
      .returning()
    const updated = sentRows.at(0)
    if (!updated) throw notFound()

    // Reset isCurrent on other proposals of the same initiative.
    await db
      .update(proposal)
      .set({ isCurrent: false })
      .where(
        and(
          eq(proposal.initiativeId, updated.initiativeId),
          ne(proposal.id, updated.id),
        ),
      )

    const typeId = await getTargetActionTypeId('proposal_sent')
    if (typeId) {
      const initiativeRow = await db.query.initiative.findFirst({
        where: eq(initiative.id, updated.initiativeId),
        columns: { departmentId: true, responsibleUserId: true },
      })
      await db.insert(targetAction).values({
        typeId,
        responsibleUserId:
          currentUserId ?? initiativeRow?.responsibleUserId ?? null,
        departmentId: initiativeRow?.departmentId ?? null,
        plannedAt: now.toISOString().split('T')[0],
        completedAt: now,
        status: 'completed',
        sourceType: 'proposal',
        sourceId: updated.id,
        initiativeId: updated.initiativeId,
        proposalId: updated.id,
      })
    }
  })

export const softDeleteProposal = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .update(proposal)
      .set({ deletedAt: new Date() })
      .where(eq(proposal.id, data.id))
  })

export const fetchInitiativesForProposal = createServerFn({
  method: 'GET',
}).handler(async () => {
  return db.query.initiative.findMany({
    columns: { id: true, title: true },
    where: (i, { isNull }) => isNull(i.deletedAt),
    orderBy: (i, { desc }) => [desc(i.createdAt)],
  })
})
