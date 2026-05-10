import { db } from '@/db'
import { company, companyContact, companyRevenue } from '@/db/schema'
import type { CompanyRow } from '@/types'
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { and, eq } from 'drizzle-orm'
import * as z from 'zod'

const companySchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  description: z
    .string()
    .min(2, 'Описание должно содержать минимум 2 символа')
    .optional(),
  regionalMarketPosition: z.string().optional(),
  industry: z.string().optional(),
})

const updateCompanySchema = companySchema.extend({
  id: z.string(),
})

const yearValueSchema = z.object({
  companyId: z.string(),
  year: z.number().int().min(2000).max(2100),
  value: z.string().min(1),
})

const addContactSchema = z.object({
  companyId: z.string(),
  name: z.string().min(1),
  position: z.string().optional(),
  description: z.string().optional(),
  contacts: z.string().optional(),
})

const updateContactSchema = addContactSchema.omit({ companyId: true }).extend({
  id: z.string(),
})

export const fetchCompanies = createServerFn().handler(async () => {
  const currentYear = new Date().getFullYear()

  const rows = await db.query.company.findMany({
    with: {
      accounts: {
        columns: { accountType: true, isTarget: true, isLost: true },
        with: {
          businessUnit: { columns: { name: true } },
        },
      },
      revenues: { columns: { year: true, value: true } },
    },
  })

  return rows.map((row): CompanyRow => {
    const clientAccounts = row.accounts.filter(
      (account) => account.accountType === 'client',
    )
    const isWishlist = row.accounts.some(
      (account) => account.accountType === 'wishlist',
    )

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      regionalMarketPosition: row.regionalMarketPosition,
      industry: row.industry,
      clients: clientAccounts.map((account) => ({
        departmentName: account.businessUnit.name,
        isTarget: account.isTarget,
        isLost: account.isLost,
      })),
      isWishlist,
      revenueLastYear:
        row.revenues.find((revenue) => revenue.year === currentYear - 1)
          ?.value ?? null,
      revenueTwoYearsAgo:
        row.revenues.find((revenue) => revenue.year === currentYear - 2)
          ?.value ?? null,
    }
  })
})

export const fetchCompany = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.company.findFirst({
      where: eq(company.id, data.id),
      with: {
        contacts: true,
        revenues: true,
        accounts: {
          columns: {
            id: true,
            accountType: true,
            isTarget: true,
            isLost: true,
            why: true,
          },
          with: {
            businessUnit: { columns: { id: true, name: true } },
          },
        },
      },
    })

    if (!row) throw notFound()
    return row
  })

export const addCompany = createServerFn({ method: 'POST' })
  .inputValidator(companySchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(company)
      .values({
        name: data.name,
        description: data.description,
        regionalMarketPosition: data.regionalMarketPosition,
        industry: data.industry,
      })
      .returning({ id: company.id })

    return inserted.id
  })

export const updateCompany = createServerFn({ method: 'POST' })
  .inputValidator(updateCompanySchema)
  .handler(async ({ data }) => {
    await db
      .update(company)
      .set({
        name: data.name,
        description: data.description,
        regionalMarketPosition: data.regionalMarketPosition,
        industry: data.industry,
      })
      .where(eq(company.id, data.id))
  })

export const deleteCompany = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    await db.delete(company).where(eq(company.id, id))
  })

export const addRevenue = createServerFn({ method: 'POST' })
  .inputValidator(yearValueSchema)
  .handler(async ({ data }) => {
    const existing = await db
      .select({ id: companyRevenue.id })
      .from(companyRevenue)
      .where(
        and(
          eq(companyRevenue.companyId, data.companyId),
          eq(companyRevenue.year, data.year),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      throw new Error(
        `Выручка за ${data.year} год уже добавлена для этой компании`,
      )
    }

    await db.insert(companyRevenue).values({
      companyId: data.companyId,
      year: data.year,
      value: data.value,
    })
  })

export const deleteRevenue = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(companyRevenue).where(eq(companyRevenue.id, data.id))
  })

export const addCompanyContact = createServerFn({ method: 'POST' })
  .inputValidator(addContactSchema)
  .handler(async ({ data }) => {
    await db.insert(companyContact).values({
      companyId: data.companyId,
      name: data.name,
      position: data.position ?? null,
      description: data.description ?? null,
      contacts: data.contacts ?? null,
    })
  })

export const updateCompanyContact = createServerFn({ method: 'POST' })
  .inputValidator(updateContactSchema)
  .handler(async ({ data }) => {
    await db
      .update(companyContact)
      .set({
        name: data.name,
        position: data.position ?? null,
        description: data.description ?? null,
        contacts: data.contacts ?? null,
      })
      .where(eq(companyContact.id, data.id))
  })

export const deleteCompanyContact = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(companyContact).where(eq(companyContact.id, data.id))
  })
