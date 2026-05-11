import { db } from '@/db'
import {
  accountGrossProfit,
  accountHook,
  accountRisk,
  accountTargetForecast,
  accountUpsellingOpportunity,
  comment,
  company,
  companyAccount,
  department,
  todo,
  todoResponsibleUsers,
  user,
} from '@/db/schema'
import type { WishlistAccountRow } from '@/types'
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import {
  and,
  count,
  countDistinct,
  eq,
  inArray,
  isNotNull,
  isNull,
  ne,
  notInArray,
  sql,
} from 'drizzle-orm'
import * as z from 'zod'

const clientAccountSchema = z.object({
  businessUnitId: z.string().uuid(),
  companyId: z.string().uuid(),
  isTarget: z.boolean(),
  isLost: z.boolean(),
  lostReasons: z.string().optional(),
  ownerUserId: z.string().optional(),
})

const updateClientAccountSchema = clientAccountSchema.extend({
  id: z.string(),
})

const wishlistAccountSchema = z.object({
  companyId: z.string().min(1, 'Выберите компанию'),
  businessUnitId: z.string().min(1, 'Выберите подразделение'),
  why: z.string().optional(),
})

const updateWishlistAccountSchema = wishlistAccountSchema
  .omit({ companyId: true })
  .extend({
    id: z.string(),
  })

const yearValueSchema = z.object({
  clientId: z.string(),
  year: z.number().int().min(2000).max(2100),
  value: z.string().min(1),
})

const textEntrySchema = z.object({
  clientId: z.string(),
  description: z.string().min(1),
})

export const fetchClients = createServerFn().handler(async () => {
  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1
  const nextYear = currentYear + 1

  const accounts = await db.query.companyAccount.findMany({
    where: eq(companyAccount.accountType, 'client'),
    with: {
      company: { columns: { id: true, name: true } },
      businessUnit: { columns: { id: true, name: true } },
      owner: { columns: { id: true, name: true } },
    },
    orderBy: (account, { asc }) => [asc(account.id)],
  })

  const accountIds = accounts.map((account) => account.id)

  if (accountIds.length === 0) {
    return { accounts: [], currentYear, lastYear, nextYear }
  }

  const [
    grossProfits,
    forecasts,
    potentialForecasts,
    risks,
    upsellings,
    marketerTodoCounts,
    managerTodoCounts,
  ] = await Promise.all([
    db
      .select({
        companyAccountId: accountGrossProfit.companyAccountId,
        value: accountGrossProfit.value,
      })
      .from(accountGrossProfit)
      .where(
        and(
          inArray(accountGrossProfit.companyAccountId, accountIds),
          eq(accountGrossProfit.year, lastYear),
        ),
      ),
    db
      .select({
        companyAccountId: accountTargetForecast.companyAccountId,
        value: accountTargetForecast.value,
      })
      .from(accountTargetForecast)
      .where(
        and(
          inArray(accountTargetForecast.companyAccountId, accountIds),
          eq(accountTargetForecast.year, currentYear),
        ),
      ),
    db
      .select({
        companyAccountId: accountTargetForecast.companyAccountId,
        value: accountTargetForecast.value,
      })
      .from(accountTargetForecast)
      .where(
        and(
          inArray(accountTargetForecast.companyAccountId, accountIds),
          eq(accountTargetForecast.year, nextYear),
        ),
      ),
    db
      .select({
        companyAccountId: accountRisk.companyAccountId,
        count: count(accountRisk.id),
      })
      .from(accountRisk)
      .where(inArray(accountRisk.companyAccountId, accountIds))
      .groupBy(accountRisk.companyAccountId),
    db
      .select({
        companyAccountId: accountUpsellingOpportunity.companyAccountId,
        count: count(accountUpsellingOpportunity.id),
      })
      .from(accountUpsellingOpportunity)
      .where(inArray(accountUpsellingOpportunity.companyAccountId, accountIds))
      .groupBy(accountUpsellingOpportunity.companyAccountId),
    db
      .select({
        companyAccountId: todo.companyAccountId,
        count: countDistinct(todo.id),
      })
      .from(todo)
      .innerJoin(todoResponsibleUsers, eq(todo.id, todoResponsibleUsers.todoId))
      .innerJoin(user, eq(todoResponsibleUsers.userId, user.id))
      .where(
        and(
          isNotNull(todo.companyAccountId),
          inArray(todo.companyAccountId, accountIds),
          ne(todo.status, 'completed'),
          isNull(todo.archivedAt),
          eq(user.role, 'marketer'),
        ),
      )
      .groupBy(todo.companyAccountId),
    db
      .select({
        companyAccountId: todo.companyAccountId,
        count: countDistinct(todo.id),
      })
      .from(todo)
      .innerJoin(todoResponsibleUsers, eq(todo.id, todoResponsibleUsers.todoId))
      .innerJoin(
        companyAccount,
        and(
          eq(todo.companyAccountId, companyAccount.id),
          eq(todoResponsibleUsers.userId, companyAccount.ownerUserId),
        ),
      )
      .where(
        and(
          isNotNull(todo.companyAccountId),
          inArray(todo.companyAccountId, accountIds),
          ne(todo.status, 'completed'),
          isNull(todo.archivedAt),
          isNotNull(companyAccount.ownerUserId),
        ),
      )
      .groupBy(todo.companyAccountId),
  ])

  const gpByAccount = Object.fromEntries(
    grossProfits.map((row) => [row.companyAccountId, row.value]),
  )
  const fcByAccount = Object.fromEntries(
    forecasts.map((row) => [row.companyAccountId, row.value]),
  )
  const potentialByAccount = Object.fromEntries(
    potentialForecasts.map((row) => [row.companyAccountId, row.value]),
  )
  const risksByAccount = Object.fromEntries(
    risks.map((row) => [row.companyAccountId, row.count]),
  )
  const upsellingByAccount = Object.fromEntries(
    upsellings.map((row) => [row.companyAccountId, row.count]),
  )
  const marketerTodos: Record<string, number> = Object.fromEntries(
    marketerTodoCounts
      .filter((row) => row.companyAccountId !== null)
      .map((row) => [row.companyAccountId!, row.count]),
  )
  const managerTodos: Record<string, number> = Object.fromEntries(
    managerTodoCounts
      .filter((row) => row.companyAccountId !== null)
      .map((row) => [row.companyAccountId!, row.count]),
  )

  const enriched = accounts.map((account) => ({
    ...account,
    gpLastYear: gpByAccount[account.id] ?? null,
    forecastCurrentYear: fcByAccount[account.id] ?? null,
    potentialNextYear: potentialByAccount[account.id] ?? null,
    risksCount: risksByAccount[account.id] ?? 0,
    upsellingCount: upsellingByAccount[account.id] ?? 0,
    marketerTodosCount: marketerTodos[account.id] ?? 0,
    managerTodosCount: managerTodos[account.id] ?? 0,
  }))

  return { accounts: enriched, currentYear, lastYear, nextYear }
})

export const fetchClient = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const [row, todos] = await Promise.all([
      db.query.companyAccount.findFirst({
        where: eq(companyAccount.id, data.id),
        with: {
          company: true,
          businessUnit: true,
          owner: { columns: { id: true, name: true, image: true } },
          risks: true,
          grossProfits: true,
          targetForecasts: true,
          upsellingOpportunities: true,
        },
      }),
      db.query.todo.findMany({
        where: eq(todo.companyAccountId, data.id),
        with: {
          responsibleUsers: {
            with: {
              user: { columns: { id: true, name: true } },
            },
          },
        },
      }),
    ])

    if (!row) throw notFound()
    return { ...row, todos }
  })

export const fetchWishlistAccounts = createServerFn().handler(async () => {
  const currentYear = new Date().getFullYear()

  const [rows, commentCounts] = await Promise.all([
    db.query.companyAccount.findMany({
      where: eq(companyAccount.accountType, 'wishlist'),
      with: {
        company: {
          columns: {
            id: true,
            name: true,
            regionalMarketPosition: true,
            industry: true,
          },
          with: {
            revenues: { columns: { year: true, value: true } },
          },
        },
        businessUnit: { columns: { name: true } },
        hooks: { columns: { description: true } },
        todos: { columns: { id: true, name: true, status: true } },
        owner: { columns: { name: true } },
      },
      orderBy: (account, { asc }) => [asc(account.position)],
    }),
    db
      .select({
        entityId: comment.entityId,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(comment)
      .where(eq(comment.entityType, 'companyAccount'))
      .groupBy(comment.entityId),
  ])

  const countMap = new Map(
    commentCounts.map((item) => [item.entityId, item.count]),
  )

  return rows.map(
    (row): WishlistAccountRow => ({
      id: row.id,
      companyId: row.companyId,
      companyName: row.company.name,
      businessUnit: row.businessUnit.name,
      industry: row.company.industry,
      regionalMarketPosition: row.company.regionalMarketPosition,
      revenueLastYear:
        row.company.revenues.find((revenue) => revenue.year === currentYear - 1)
          ?.value ?? null,
      revenueTwoYearsAgo:
        row.company.revenues.find((revenue) => revenue.year === currentYear - 2)
          ?.value ?? null,
      why: row.why,
      hooks: row.hooks.map((hook) => hook.description),
      todos: row.todos.map((item) => ({
        id: item.id,
        name: item.name,
        status: item.status as WishlistAccountRow['todos'][number]['status'],
      })),
      commentsCount: countMap.get(row.id) ?? 0,
      responsible: row.owner?.name ?? null,
      wishlistState:
        (row.wishlistState as WishlistAccountRow['wishlistState']) ?? null,
      position: row.position,
    }),
  )
})

export const fetchWishlistClient = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.companyAccount.findFirst({
      where: and(
        eq(companyAccount.id, data.id),
        eq(companyAccount.accountType, 'wishlist'),
      ),
      with: {
        company: {
          with: {
            revenues: true,
            contacts: true,
          },
        },
        businessUnit: { columns: { id: true, name: true } },
        owner: { columns: { id: true, name: true } },
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
    })

    if (!row) throw notFound()
    return row
  })

export const getFilteredUsers = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ businessUnitId: z.string() }))
  .handler(async ({ data }) => {
    return db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(
        and(ne(user.role, 'user'), eq(user.departmentId, data.businessUnitId)),
      )
      .orderBy(user.name)
  })

export const getFilteredCompanies = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      businessUnitId: z.string(),
      excludeAccountId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const clientCompanyIds = db
      .select({ id: companyAccount.companyId })
      .from(companyAccount)
      .where(
        and(
          eq(companyAccount.businessUnitId, data.businessUnitId),
          eq(companyAccount.accountType, 'client'),
          data.excludeAccountId
            ? ne(companyAccount.id, data.excludeAccountId)
            : undefined,
        ),
      )

    const wishlistCompanyIds = db
      .select({ id: companyAccount.companyId })
      .from(companyAccount)
      .where(eq(companyAccount.accountType, 'wishlist'))

    return db
      .select({ id: company.id, name: company.name })
      .from(company)
      .where(
        and(
          notInArray(company.id, clientCompanyIds),
          notInArray(company.id, wishlistCompanyIds),
        ),
      )
      .orderBy(company.name)
  })

export const getFilteredDepartments = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      companyId: z.string(),
      excludeAccountId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const existingBusinessUnitIds = db
      .select({ id: companyAccount.businessUnitId })
      .from(companyAccount)
      .where(
        and(
          eq(companyAccount.companyId, data.companyId),
          eq(companyAccount.accountType, 'client'),
          data.excludeAccountId
            ? ne(companyAccount.id, data.excludeAccountId)
            : undefined,
        ),
      )

    return db
      .select({ id: department.id, name: department.name })
      .from(department)
      .where(notInArray(department.id, existingBusinessUnitIds))
      .orderBy(department.name)
  })

export const getCompanyById = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const result = await db
      .select({ id: company.id, name: company.name })
      .from(company)
      .where(eq(company.id, data.id))
      .limit(1)

    return result[0] ?? null
  })

export const addAccount = createServerFn({ method: 'POST' })
  .inputValidator(clientAccountSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(companyAccount)
      .values({
        companyId: data.companyId,
        businessUnitId: data.businessUnitId,
        accountType: 'client',
        isTarget: data.isTarget,
        isLost: data.isLost,
        lostReasons: data.lostReasons ?? null,
        ownerUserId: data.ownerUserId ?? null,
      })
      .returning({ id: companyAccount.id })

    return inserted.id
  })

export const updateAccount = createServerFn({ method: 'POST' })
  .inputValidator(updateClientAccountSchema)
  .handler(async ({ data }) => {
    await db
      .update(companyAccount)
      .set({
        companyId: data.companyId,
        businessUnitId: data.businessUnitId,
        isTarget: data.isTarget,
        isLost: data.isLost,
        lostReasons: data.lostReasons ?? null,
        ownerUserId: data.ownerUserId ?? null,
      })
      .where(eq(companyAccount.id, data.id))
  })

export const deleteClient = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    await db.delete(companyAccount).where(eq(companyAccount.id, id))
  })

export const getFilteredWishlistCompanies = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ excludeWishlistClientId: z.string().optional() }))
  .handler(async ({ data }) => {
    const excludedCompanyIds = db
      .select({ id: companyAccount.companyId })
      .from(companyAccount)
      .where(
        and(
          eq(companyAccount.accountType, 'wishlist'),
          data.excludeWishlistClientId
            ? ne(companyAccount.id, data.excludeWishlistClientId)
            : undefined,
        ),
      )

    return db
      .select({ id: company.id, name: company.name })
      .from(company)
      .where(notInArray(company.id, excludedCompanyIds))
      .orderBy(company.name)
  })

export const addWishlistClient = createServerFn({ method: 'POST' })
  .inputValidator(wishlistAccountSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(companyAccount)
      .values({
        companyId: data.companyId,
        businessUnitId: data.businessUnitId,
        accountType: 'wishlist',
        why: data.why ?? null,
      })
      .returning({ id: companyAccount.id })

    return inserted.id
  })

export const updateWishlistClient = createServerFn({ method: 'POST' })
  .inputValidator(updateWishlistAccountSchema)
  .handler(async ({ data }) => {
    await db
      .update(companyAccount)
      .set({
        businessUnitId: data.businessUnitId,
        why: data.why ?? null,
      })
      .where(eq(companyAccount.id, data.id))
  })

export const deleteWishlistClient = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    await db.delete(companyAccount).where(eq(companyAccount.id, id))
  })

export const addGrossProfit = createServerFn({ method: 'POST' })
  .inputValidator(yearValueSchema)
  .handler(async ({ data }) => {
    const existing = await db
      .select({ id: accountGrossProfit.id })
      .from(accountGrossProfit)
      .where(
        and(
          eq(accountGrossProfit.companyAccountId, data.clientId),
          eq(accountGrossProfit.year, data.year),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      throw new Error(
        `Запись ВП за ${data.year} год уже существует для этого клиента`,
      )
    }

    await db.insert(accountGrossProfit).values({
      companyAccountId: data.clientId,
      year: data.year,
      value: data.value,
    })
  })

export const deleteGrossProfit = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .delete(accountGrossProfit)
      .where(eq(accountGrossProfit.id, data.id))
  })

export const addTargetForecast = createServerFn({ method: 'POST' })
  .inputValidator(yearValueSchema)
  .handler(async ({ data }) => {
    const existing = await db
      .select({ id: accountTargetForecast.id })
      .from(accountTargetForecast)
      .where(
        and(
          eq(accountTargetForecast.companyAccountId, data.clientId),
          eq(accountTargetForecast.year, data.year),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      throw new Error(
        `Прогноз за ${data.year} год уже существует для этого клиента`,
      )
    }

    await db.insert(accountTargetForecast).values({
      companyAccountId: data.clientId,
      year: data.year,
      value: data.value,
    })
  })

export const deleteTargetForecast = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .delete(accountTargetForecast)
      .where(eq(accountTargetForecast.id, data.id))
  })

export const addRisk = createServerFn({ method: 'POST' })
  .inputValidator(textEntrySchema)
  .handler(async ({ data }) => {
    await db.insert(accountRisk).values({
      companyAccountId: data.clientId,
      description: data.description,
    })
  })

export const deleteRisk = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(accountRisk).where(eq(accountRisk.id, data.id))
  })

export const addUpselling = createServerFn({ method: 'POST' })
  .inputValidator(textEntrySchema)
  .handler(async ({ data }) => {
    await db.insert(accountUpsellingOpportunity).values({
      companyAccountId: data.clientId,
      description: data.description,
    })
  })

export const deleteUpselling = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .delete(accountUpsellingOpportunity)
      .where(eq(accountUpsellingOpportunity.id, data.id))
  })

export const addHook = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ wishlistClientId: z.string(), description: z.string().min(1) }),
  )
  .handler(async ({ data }) => {
    await db.insert(accountHook).values({
      companyAccountId: data.wishlistClientId,
      description: data.description,
    })
  })

export const deleteHook = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(accountHook).where(eq(accountHook.id, data.id))
  })
