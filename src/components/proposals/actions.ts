import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { notFound } from '@tanstack/react-router'
import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '@/db'
import {
  proposal,
  proposalDocument,
  document,
  initiative,
  user,
  targetAction,
} from '@/db/schema'
import { auth } from 'utils/auth'
import { ensureTargetActionTypeId } from '@/components/target-actions/ensure-type'
import {
  assertDocumentFileAllowed,
  DOCUMENT_FILE_MAX_SIZE_BYTES,
} from '@/components/documents/actions'
import { deleteS3Object, uploadBase64FileToS3 } from '@/lib/s3'
import { normalizeBase64Payload } from '@/lib/file-upload'
import { slugForFileName } from '@/lib/transliterate'
import type { DocumentRef, ProposalRow, ProposalStatus } from '@/types'

async function getCurrentUserId(): Promise<string | null> {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  return session?.user.id ?? null
}

async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Не авторизовано')
  return userId
}

const PROPOSAL_SELECT = {
  id: proposal.id,
  initiativeId: proposal.initiativeId,
  initiativeTitle: initiative.title,
  version: proposal.version,
  status: proposal.status,
  description: proposal.description,
  senderUserId: proposal.senderUserId,
  senderUserName: user.name,
  preparedAt: proposal.preparedAt,
  approvedAt: proposal.approvedAt,
  sentAt: proposal.sentAt,
  createdAt: proposal.createdAt,
  updatedAt: proposal.updatedAt,
} as const

type RawRow = {
  id: string
  initiativeId: string
  initiativeTitle: string | null
  version: number
  status: string
  description: string | null
  senderUserId: string | null
  senderUserName: string | null
  preparedAt: Date | null
  approvedAt: Date | null
  sentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

function mapRow(
  r: RawRow,
  isCurrent: boolean,
  documents: DocumentRef[] = [],
): ProposalRow {
  return {
    id: r.id,
    initiativeId: r.initiativeId,
    initiativeTitle: r.initiativeTitle,
    version: r.version,
    status: r.status as ProposalStatus,
    isCurrent,
    description: r.description,
    senderUserId: r.senderUserId,
    senderUserName: r.senderUserName,
    preparedAt: r.preparedAt,
    approvedAt: r.approvedAt,
    sentAt: r.sentAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    documents,
  }
}

// Загружает вложения для набора КП одним запросом и группирует по proposalId.
async function loadDocumentsByProposal(
  proposalIds: string[],
): Promise<Map<string, DocumentRef[]>> {
  const byProposal = new Map<string, DocumentRef[]>()
  if (proposalIds.length === 0) return byProposal
  const links = await db.query.proposalDocument.findMany({
    where: inArray(proposalDocument.proposalId, proposalIds),
    with: { document: { columns: { id: true, name: true, url: true } } },
  })
  for (const link of links) {
    const list = byProposal.get(link.proposalId) ?? []
    list.push(link.document)
    byProposal.set(link.proposalId, list)
  }
  return byProposal
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

    // «Актуальное» = КП с наибольшим номером версии (версии уникальны в инициативе).
    const maxVersion = rows.reduce((max, r) => Math.max(max, r.version), 0)
    const docsByProposal = await loadDocumentsByProposal(rows.map((r) => r.id))
    return rows.map((r) =>
      mapRow(r, r.version === maxVersion, docsByProposal.get(r.id) ?? []),
    )
  })

// ─── Вложение файла КП (S3) ──────────────────────────────────────────────────

type ProposalFileInput = {
  fileName: string
  mimeType: string
  fileSize: number
  fileBase64: string
}

const proposalFileSchema = z.object({
  fileName: z.string().trim().min(1, 'Выберите файл'),
  mimeType: z.string().trim().min(1),
  fileSize: z.number().int().positive('Файл пустой'),
  fileBase64: z.string().trim().min(1, 'Файл пустой'),
})

// Имена клиента и бизнес-юнита для человекочитаемого имени файла.
async function deriveClientBuNames(
  initiativeId: string,
): Promise<{ client: string; businessUnit: string }> {
  const row = await db.query.initiative.findFirst({
    where: eq(initiative.id, initiativeId),
    with: {
      company: { columns: { name: true } },
      department: { columns: { name: true } },
      companyAccount: {
        with: {
          company: { columns: { name: true } },
          businessUnit: { columns: { name: true } },
        },
      },
    },
  })
  const client =
    row?.companyAccount?.company.name ?? row?.company?.name ?? 'client'
  const businessUnit =
    row?.companyAccount?.businessUnit.name ?? row?.department?.name ?? 'unit'
  return { client, businessUnit }
}

// Загружает файл КП в S3 с именем-транслитом client_businessUnit_vVersion_timestamp
// и привязывает его к КП через proposal_document.
async function attachProposalFile(params: {
  proposalId: string
  initiativeId: string
  version: number
  userId: string
  file: ProposalFileInput
}): Promise<void> {
  assertDocumentFileAllowed({
    mimeType: params.file.mimeType,
    fileSize: params.file.fileSize,
  })
  const normalizedBase64 = normalizeBase64Payload(params.file.fileBase64)
  if (!normalizedBase64) throw new Error('Файл пустой')

  const { client, businessUnit } = await deriveClientBuNames(
    params.initiativeId,
  )
  const fileNamePrefix = `${slugForFileName(client, 'client')}_${slugForFileName(
    businessUnit,
    'unit',
  )}_v${params.version}`

  const { objectKey } = await uploadBase64FileToS3({
    fileName: params.file.fileName,
    mimeType: params.file.mimeType.trim().toLowerCase(),
    fileSize: params.file.fileSize,
    fileBase64: normalizedBase64,
    maxSizeBytes: DOCUMENT_FILE_MAX_SIZE_BYTES,
    pathPrefix: 'proposals',
    fileNamePrefix,
  })

  const displayName = objectKey.split('/').pop() ?? params.file.fileName
  const [doc] = await db
    .insert(document)
    .values({ name: displayName, url: objectKey, uploadedBy: params.userId })
    .returning({ id: document.id })
  await db
    .insert(proposalDocument)
    .values({ proposalId: params.proposalId, documentId: doc.id })
}

// Удаляет все вложения КП (записи document + объекты S3); каскад снимает связи.
async function detachProposalDocuments(proposalId: string): Promise<void> {
  const links = await db.query.proposalDocument.findMany({
    where: eq(proposalDocument.proposalId, proposalId),
    with: { document: { columns: { id: true, url: true } } },
  })
  for (const link of links) {
    await db.delete(document).where(eq(document.id, link.documentId))
    const fileRef = link.document.url.trim()
    if (fileRef && !/^https?:\/\//i.test(fileRef)) {
      await deleteS3Object(fileRef).catch(() => {})
    }
  }
}

// ─── Статус и его эффекты ─────────────────────────────────────────────────────

// Создаёт KPI-цель (выполненное целевое действие) для статусного перехода КП.
async function createProposalTargetAction(
  slug: 'proposal_ready' | 'proposal_sent',
  proposalId: string,
  initiativeId: string,
  userId: string | null,
  when: Date,
): Promise<void> {
  const typeId = await ensureTargetActionTypeId(slug)
  const initiativeRow = await db.query.initiative.findFirst({
    where: eq(initiative.id, initiativeId),
    columns: { departmentId: true, responsibleUserId: true },
  })
  await db.insert(targetAction).values({
    typeId,
    responsibleUserId: userId ?? initiativeRow?.responsibleUserId ?? null,
    departmentId: initiativeRow?.departmentId ?? null,
    plannedAt: when.toISOString().split('T')[0],
    completedAt: when,
    status: 'completed',
    sourceType: 'proposal',
    sourceId: proposalId,
    initiativeId,
    proposalId,
  })
}

// Переводит КП в новый статус: проставляет таймстемпы при первом входе в статус
// и идемпотентно создаёт KPI-цели (proposal_ready / proposal_sent).
async function applyProposalStatusEffects(params: {
  row: {
    id: string
    initiativeId: string
    status: ProposalStatus
    preparedAt: Date | null
    approvedAt: Date | null
    sentAt: Date | null
  }
  nextStatus: ProposalStatus
  userId: string | null
}): Promise<void> {
  const { row, nextStatus, userId } = params
  if (row.status === nextStatus) return

  const now = new Date()
  const enteringPrepared = nextStatus === 'prepared' && !row.preparedAt
  const enteringApproved = nextStatus === 'approved' && !row.approvedAt
  const enteringSent = nextStatus === 'sent' && !row.sentAt

  const patch: Partial<{
    status: ProposalStatus
    preparedAt: Date
    approvedAt: Date
    sentAt: Date
    senderUserId: string | null
  }> = { status: nextStatus }
  if (enteringPrepared) patch.preparedAt = now
  if (enteringApproved) patch.approvedAt = now
  if (enteringSent) {
    patch.sentAt = now
    patch.senderUserId = userId
  }

  await db.update(proposal).set(patch).where(eq(proposal.id, row.id))

  if (enteringPrepared) {
    await createProposalTargetAction(
      'proposal_ready',
      row.id,
      row.initiativeId,
      userId,
      now,
    )
  }
  if (enteringSent) {
    await createProposalTargetAction(
      'proposal_sent',
      row.id,
      row.initiativeId,
      userId,
      now,
    )
  }
}

// ─── Публичные экшены ─────────────────────────────────────────────────────────

const proposalInputSchema = z.object({
  initiativeId: z.string().min(1),
  status: z.enum(['draft', 'prepared', 'approved', 'sent']).default('draft'),
  description: z.string().nullable().optional(),
  file: proposalFileSchema.nullable().optional(),
})

export const addProposal = createServerFn({ method: 'POST' })
  .inputValidator(proposalInputSchema)
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    // Следующая версия = max(version) + 1 в рамках инициативы.
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
        version: nextVersion,
        description: data.description ?? null,
        status: 'draft',
      })
      .returning({ id: proposal.id })

    // Применяем выбранный статус поверх базового draft (таймстемпы + KPI).
    if (data.status !== 'draft') {
      await applyProposalStatusEffects({
        row: {
          id: inserted.id,
          initiativeId: data.initiativeId,
          status: 'draft',
          preparedAt: null,
          approvedAt: null,
          sentAt: null,
        },
        nextStatus: data.status,
        userId,
      })
    }

    if (data.file) {
      await attachProposalFile({
        proposalId: inserted.id,
        initiativeId: data.initiativeId,
        version: nextVersion,
        userId,
        file: data.file,
      })
    }

    return { id: inserted.id }
  })

export const updateProposal = createServerFn({ method: 'POST' })
  .inputValidator(proposalInputSchema.extend({ id: z.string() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    const current = await db.query.proposal.findFirst({
      where: and(eq(proposal.id, data.id), isNull(proposal.deletedAt)),
      columns: {
        id: true,
        initiativeId: true,
        version: true,
        status: true,
        preparedAt: true,
        approvedAt: true,
        sentAt: true,
      },
    })
    if (!current) throw notFound()

    await db
      .update(proposal)
      .set({ description: data.description ?? null })
      .where(eq(proposal.id, data.id))

    if (data.status !== current.status) {
      await applyProposalStatusEffects({
        row: {
          id: current.id,
          initiativeId: current.initiativeId,
          status: current.status,
          preparedAt: current.preparedAt,
          approvedAt: current.approvedAt,
          sentAt: current.sentAt,
        },
        nextStatus: data.status,
        userId,
      })
    }

    // Новый файл заменяет прежнее вложение.
    if (data.file) {
      await detachProposalDocuments(data.id)
      await attachProposalFile({
        proposalId: data.id,
        initiativeId: current.initiativeId,
        version: current.version,
        userId,
        file: data.file,
      })
    }
  })

// Перевод КП в указанный статус — для кнопки «следующий статус» на карточке.
export const setProposalStatus = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      status: z.enum(['draft', 'prepared', 'approved', 'sent']),
    }),
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const current = await db.query.proposal.findFirst({
      where: and(eq(proposal.id, data.id), isNull(proposal.deletedAt)),
      columns: {
        id: true,
        initiativeId: true,
        status: true,
        preparedAt: true,
        approvedAt: true,
        sentAt: true,
      },
    })
    if (!current) throw notFound()
    await applyProposalStatusEffects({
      row: current,
      nextStatus: data.status,
      userId,
    })
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
