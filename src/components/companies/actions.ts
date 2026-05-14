import { db } from '@/db'
import {
  company,
  companyContact,
  companyCounterparty,
  companyRevenue,
  counterparty,
  industry,
} from '@/db/schema'
import type { CompanyRow } from '@/types'
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { and, count, eq } from 'drizzle-orm'
import * as z from 'zod'

const companySchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  scope: z.enum(['federal', 'regional']).optional(),
  website: z.string().optional(),
  description: z
    .string()
    .min(2, 'Описание должно содержать минимум 2 символа')
    .optional(),
  regionalMarketPosition: z.string().optional(),
  industryId: z.string().optional().nullable(),
  // Legacy compatibility for older inline create callers.
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
  phone: z.string().optional(),
  email: z.string().optional(),
  telegram: z.string().optional(),
  max: z.string().optional(),
})

const updateContactSchema = addContactSchema.omit({ companyId: true }).extend({
  id: z.string(),
})

const addCounterpartySchema = z.object({
  companyId: z.string(),
  name: z.string().min(2, 'Минимум 2 символа'),
  fullName: z.string().optional(),
  tin: z.string().optional(),
  bankAccount: z.string().optional(),
})

const updateCounterpartySchema = addCounterpartySchema
  .omit({ companyId: true })
  .extend({
    id: z.string(),
  })

async function getIndustryName(industryId?: string | null) {
  if (!industryId) return null

  const row = await db.query.industry.findFirst({
    where: eq(industry.id, industryId),
    columns: { name: true },
  })

  return row?.name ?? null
}

async function normalizeIndustry(data: {
  industryId?: string | null
  industry?: string
}) {
  const industryName = data.industryId
    ? await getIndustryName(data.industryId)
    : (data.industry?.trim() ?? null)

  return {
    industryId: data.industryId || null,
    industryName: industryName || null,
  }
}

export const fetchCompanies = createServerFn().handler(async () => {
  const currentYear = new Date().getFullYear()

  const rows = await db.query.company.findMany({
    with: {
      industryRef: { columns: { name: true } },
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
      industry: row.industryRef?.name ?? row.industry,
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
        industryRef: { columns: { id: true, name: true } },
        contacts: true,
        revenues: true,
        counterparties: {
          with: {
            counterparty: {
              columns: {
                id: true,
                name: true,
                fullName: true,
                tin: true,
                bankAccount: true,
              },
            },
          },
        },
        accounts: {
          columns: {
            id: true,
            businessUnitId: true,
            accountType: true,
            isTarget: true,
            isLost: true,
            lostReasons: true,
            why: true,
            wishlistState: true,
          },
          with: {
            businessUnit: { columns: { id: true, name: true } },
            owner: { columns: { id: true, name: true, image: true } },
            managers: {
              with: {
                user: { columns: { id: true, name: true, image: true } },
              },
            },
            risks: true,
            grossProfits: true,
            targetForecasts: true,
            upsellingOpportunities: true,
            hooks: true,
            todos: {
              columns: {
                id: true,
                name: true,
                status: true,
                deadline: true,
                completedAt: true,
                archivedAt: true,
                createdAt: true,
              },
              with: {
                responsibleUsers: {
                  with: {
                    user: { columns: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!row) throw notFound()
    return {
      ...row,
      industry: row.industryRef?.name ?? row.industry,
    }
  })

export const addCompany = createServerFn({ method: 'POST' })
  .inputValidator(companySchema)
  .handler(async ({ data }) => {
    const { industryId, industryName } = await normalizeIndustry(data)

    const [inserted] = await db
      .insert(company)
      .values({
        name: data.name,
        scope: data.scope ?? null,
        website: data.website ?? null,
        description: data.description,
        regionalMarketPosition: data.regionalMarketPosition,
        industryId,
        industry: industryName,
      })
      .returning({ id: company.id })

    return inserted.id
  })

export const updateCompany = createServerFn({ method: 'POST' })
  .inputValidator(updateCompanySchema)
  .handler(async ({ data }) => {
    const { industryId, industryName } = await normalizeIndustry(data)

    await db
      .update(company)
      .set({
        name: data.name,
        scope: data.scope ?? null,
        website: data.website ?? null,
        description: data.description,
        regionalMarketPosition: data.regionalMarketPosition,
        industryId,
        industry: industryName,
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
      phone: data.phone ?? null,
      email: data.email ?? null,
      telegram: data.telegram ?? null,
      max: data.max ?? null,
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
        phone: data.phone ?? null,
        email: data.email ?? null,
        telegram: data.telegram ?? null,
        max: data.max ?? null,
      })
      .where(eq(companyContact.id, data.id))
  })

export const deleteCompanyContact = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(companyContact).where(eq(companyContact.id, data.id))
  })

export const addCompanyCounterparty = createServerFn({ method: 'POST' })
  .inputValidator(addCounterpartySchema)
  .handler(async ({ data }) => {
    await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(counterparty)
        .values({
          name: data.name,
          fullName: data.fullName ?? null,
          tin: data.tin ?? null,
          bankAccount: data.bankAccount ?? null,
        })
        .returning({ id: counterparty.id })

      await tx.insert(companyCounterparty).values({
        companyId: data.companyId,
        counterpartyId: inserted.id,
      })
    })
  })

export const updateCounterparty = createServerFn({ method: 'POST' })
  .inputValidator(updateCounterpartySchema)
  .handler(async ({ data }) => {
    await db
      .update(counterparty)
      .set({
        name: data.name,
        fullName: data.fullName ?? null,
        tin: data.tin ?? null,
        bankAccount: data.bankAccount ?? null,
      })
      .where(eq(counterparty.id, data.id))
  })

export const removeCompanyCounterparty = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      companyId: z.string(),
      counterpartyId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    await db.transaction(async (tx) => {
      await tx
        .delete(companyCounterparty)
        .where(
          and(
            eq(companyCounterparty.companyId, data.companyId),
            eq(companyCounterparty.counterpartyId, data.counterpartyId),
          ),
        )

      const [refs] = await tx
        .select({ n: count() })
        .from(companyCounterparty)
        .where(eq(companyCounterparty.counterpartyId, data.counterpartyId))

      if (refs.n === 0) {
        await tx
          .delete(counterparty)
          .where(eq(counterparty.id, data.counterpartyId))
      }
    })
  })
