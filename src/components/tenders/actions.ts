import { db } from '@/db'
import { tender, company, department, user, industry } from '@/db/schema'
import type { TenderRow } from '@/types'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { notFound } from '@tanstack/react-router'
import { and, eq, isNull, or } from 'drizzle-orm'
import { auth } from 'utils/auth'
import * as z from 'zod'

async function getCurrentUserWithDeptId() {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return null
  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { id: true, role: true, departmentId: true },
  })
  return dbUser ?? null
}

const tenderInputSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  companyId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  responsibleUserId: z.string().nullable().optional(),
  approverUserId: z.string().nullable().optional(),
  industryId: z.string().nullable().optional(),
  status: z
    .enum([
      'new',
      'evaluation',
      'approval',
      'preparation',
      'submitted',
      'won',
      'lost',
      'rejected',
      'archived',
    ])
    .default('new'),
  amount: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  platform: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  lostReason: z.string().nullable().optional(),
})

const updateTenderSchema = tenderInputSchema.extend({ id: z.string() })

export const fetchTenders = createServerFn({ method: 'GET' }).handler(
  async (): Promise<TenderRow[]> => {
    const currentUser = await getCurrentUserWithDeptId()

    const rows = await db
      .select({
        id: tender.id,
        title: tender.title,
        status: tender.status,
        amount: tender.amount,
        deadline: tender.deadline,
        platform: tender.platform,
        url: tender.url,
        createdAt: tender.createdAt,
        companyId: tender.companyId,
        companyName: company.name,
        departmentId: tender.departmentId,
        departmentName: department.name,
        responsibleUserId: tender.responsibleUserId,
        responsibleUserName: user.name,
        approverUserId: tender.approverUserId,
        industryId: tender.industryId,
        industryName: industry.name,
      })
      .from(tender)
      .leftJoin(company, eq(tender.companyId, company.id))
      .leftJoin(department, eq(tender.departmentId, department.id))
      .leftJoin(user, eq(tender.responsibleUserId, user.id))
      .leftJoin(industry, eq(tender.industryId, industry.id))
      .where(
        and(
          isNull(tender.deletedAt),
          currentUser?.role === 'admin' || currentUser?.role === 'tender_specialist'
            ? undefined
            : currentUser?.departmentId
              ? or(
                  eq(tender.departmentId, currentUser.departmentId),
                  isNull(tender.departmentId),
                )
              : isNull(tender.departmentId),
        ),
      )

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status as TenderRow['status'],
      amount: row.amount,
      deadline: row.deadline,
      platform: row.platform,
      url: row.url,
      createdAt: row.createdAt,
      companyId: row.companyId,
      companyName: row.companyName ?? null,
      departmentId: row.departmentId,
      departmentName: row.departmentName ?? null,
      responsibleUserId: row.responsibleUserId,
      responsibleUserName: row.responsibleUserName ?? null,
      approverUserId: row.approverUserId,
      approverUserName: null,
      industryId: row.industryId,
      industryName: row.industryName ?? null,
    }))
  },
)

export const fetchTender = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.tender.findFirst({
      where: and(eq(tender.id, data.id), isNull(tender.deletedAt)),
      with: {
        company: { columns: { id: true, name: true } },
        department: { columns: { id: true, name: true } },
        responsible: { columns: { id: true, name: true } },
        approver: { columns: { id: true, name: true } },
        industry: { columns: { id: true, name: true } },
      },
    })
    if (!row) throw notFound()
    return row
  })

export const addTender = createServerFn({ method: 'POST' })
  .inputValidator(tenderInputSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(tender)
      .values({
        title: data.title,
        companyId: data.companyId ?? null,
        departmentId: data.departmentId ?? null,
        responsibleUserId: data.responsibleUserId ?? null,
        approverUserId: data.approverUserId ?? null,
        industryId: data.industryId ?? null,
        status: data.status,
        amount: data.amount ?? null,
        description: data.description ?? null,
        deadline: data.deadline ?? null,
        platform: data.platform ?? null,
        url: data.url ?? null,
        lostReason: data.lostReason ?? null,
      })
      .returning({ id: tender.id })
    return { id: inserted.id }
  })

export const updateTender = createServerFn({ method: 'POST' })
  .inputValidator(updateTenderSchema)
  .handler(async ({ data }) => {
    await db
      .update(tender)
      .set({
        title: data.title,
        companyId: data.companyId ?? null,
        departmentId: data.departmentId ?? null,
        responsibleUserId: data.responsibleUserId ?? null,
        approverUserId: data.approverUserId ?? null,
        industryId: data.industryId ?? null,
        status: data.status,
        amount: data.amount ?? null,
        description: data.description ?? null,
        deadline: data.deadline ?? null,
        platform: data.platform ?? null,
        url: data.url ?? null,
        lostReason: data.lostReason ?? null,
      })
      .where(eq(tender.id, data.id))
  })

export const softDeleteTender = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .update(tender)
      .set({ deletedAt: new Date() })
      .where(eq(tender.id, data.id))
  })

export const fetchCompanies = createServerFn({ method: 'GET' }).handler(async () =>
  db.select({ id: company.id, name: company.name }).from(company).orderBy(company.name),
)

export const fetchDepartments = createServerFn({ method: 'GET' }).handler(async () =>
  db.select({ id: department.id, name: department.name }).from(department).orderBy(department.name),
)

export const fetchUsers = createServerFn({ method: 'GET' }).handler(async () =>
  db.select({ id: user.id, name: user.name }).from(user).orderBy(user.name),
)

export const fetchIndustries = createServerFn({ method: 'GET' }).handler(async () =>
  db.select({ id: industry.id, name: industry.name }).from(industry).orderBy(industry.name),
)
