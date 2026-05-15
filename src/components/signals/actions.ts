import { db } from '@/db'
import { signal, company, department, user, industry } from '@/db/schema'
import type { SignalRow } from '@/types'
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

const signalInputSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  companyId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  responsibleUserId: z.string().nullable().optional(),
  industryId: z.string().nullable().optional(),
  signalType: z.enum(['recommendation', 'news', 'direct_contact', 'other']).default('other'),
  status: z.enum(['new', 'in_progress', 'converted', 'archived']).default('new'),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  description: z.string().nullable().optional(),
})

const updateSignalSchema = signalInputSchema.extend({ id: z.string() })

export const fetchSignals = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SignalRow[]> => {
    const currentUser = await getCurrentUserWithDeptId()

    const rows = await db
      .select({
        id: signal.id,
        title: signal.title,
        status: signal.status,
        signalType: signal.signalType,
        rating: signal.rating,
        createdAt: signal.createdAt,
        companyId: signal.companyId,
        companyName: company.name,
        departmentId: signal.departmentId,
        departmentName: department.name,
        responsibleUserId: signal.responsibleUserId,
        responsibleUserName: user.name,
        industryId: signal.industryId,
        industryName: industry.name,
      })
      .from(signal)
      .leftJoin(company, eq(signal.companyId, company.id))
      .leftJoin(department, eq(signal.departmentId, department.id))
      .leftJoin(user, eq(signal.responsibleUserId, user.id))
      .leftJoin(industry, eq(signal.industryId, industry.id))
      .where(
        and(
          isNull(signal.deletedAt),
          currentUser?.role === 'admin' || currentUser?.role === 'tender_specialist'
            ? undefined
            : currentUser?.departmentId
              ? or(
                  eq(signal.departmentId, currentUser.departmentId),
                  isNull(signal.departmentId),
                )
              : isNull(signal.departmentId),
        ),
      )

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status as SignalRow['status'],
      signalType: row.signalType as SignalRow['signalType'],
      rating: row.rating,
      createdAt: row.createdAt,
      companyId: row.companyId,
      companyName: row.companyName ?? null,
      departmentId: row.departmentId,
      departmentName: row.departmentName ?? null,
      responsibleUserId: row.responsibleUserId,
      responsibleUserName: row.responsibleUserName ?? null,
      industryId: row.industryId,
      industryName: row.industryName ?? null,
    }))
  },
)

export const fetchSignal = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.signal.findFirst({
      where: and(eq(signal.id, data.id), isNull(signal.deletedAt)),
      with: {
        company: { columns: { id: true, name: true } },
        department: { columns: { id: true, name: true } },
        responsible: { columns: { id: true, name: true } },
        industry: { columns: { id: true, name: true } },
      },
    })
    if (!row) throw notFound()
    return row
  })

export const addSignal = createServerFn({ method: 'POST' })
  .inputValidator(signalInputSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(signal)
      .values({
        title: data.title,
        companyId: data.companyId ?? null,
        departmentId: data.departmentId ?? null,
        responsibleUserId: data.responsibleUserId ?? null,
        industryId: data.industryId ?? null,
        signalType: data.signalType,
        status: data.status,
        rating: data.rating ?? null,
        description: data.description ?? null,
      })
      .returning({ id: signal.id })
    return { id: inserted.id }
  })

export const updateSignal = createServerFn({ method: 'POST' })
  .inputValidator(updateSignalSchema)
  .handler(async ({ data }) => {
    await db
      .update(signal)
      .set({
        title: data.title,
        companyId: data.companyId ?? null,
        departmentId: data.departmentId ?? null,
        responsibleUserId: data.responsibleUserId ?? null,
        industryId: data.industryId ?? null,
        signalType: data.signalType,
        status: data.status,
        rating: data.rating ?? null,
        description: data.description ?? null,
      })
      .where(eq(signal.id, data.id))
  })

export const softDeleteSignal = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .update(signal)
      .set({ deletedAt: new Date() })
      .where(eq(signal.id, data.id))
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
