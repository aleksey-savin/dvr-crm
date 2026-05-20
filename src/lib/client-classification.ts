import { db } from '@/db'
import {
  accountGrossProfit,
  accountRisk,
  accountTargetForecast,
  accountUpsellingOpportunity,
  clientClassificationSettings,
  comment,
  companyAccount,
  todo,
} from '@/db/schema'
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm'

export const CLIENT_CLASSIFICATION_SETTINGS_ID = 'default'

export const DEFAULT_CLIENT_CLASSIFICATION_SETTINGS = {
  targetGrossProfitThreshold: '0',
  lostActivityYears: 1,
}

type ClientClassificationSettings = {
  targetGrossProfitThreshold: string
  lostActivityYears: number
}

type RecalculationResult = {
  checked: number
  updated: number
  target: number
  regular: number
  lost: number
}

export async function ensureClientClassificationSettings() {
  const existing = await db
    .select()
    .from(clientClassificationSettings)
    .where(
      eq(clientClassificationSettings.id, CLIENT_CLASSIFICATION_SETTINGS_ID),
    )
    .limit(1)

  if (existing[0]) return existing[0]

  const inserted = await db
    .insert(clientClassificationSettings)
    .values({ id: CLIENT_CLASSIFICATION_SETTINGS_ID })
    .onConflictDoNothing()
    .returning()

  if (inserted[0]) return inserted[0]

  const createdByAnotherRequest = await db
    .select()
    .from(clientClassificationSettings)
    .where(
      eq(clientClassificationSettings.id, CLIENT_CLASSIFICATION_SETTINGS_ID),
    )
    .limit(1)
    .then((rows) => rows.at(0))

  if (!createdByAnotherRequest) {
    throw new Error('Не удалось создать настройки классификации клиентов')
  }

  return createdByAnotherRequest
}

export async function recalculateClientClassifications(
  accountIds?: string[],
  settings?: ClientClassificationSettings,
): Promise<RecalculationResult> {
  if (accountIds && accountIds.length === 0) {
    return { checked: 0, updated: 0, target: 0, regular: 0, lost: 0 }
  }

  const effectiveSettings =
    settings ?? (await ensureClientClassificationSettings())
  const targetThreshold = Number(effectiveSettings.targetGrossProfitThreshold)
  const lostActivityYears = effectiveSettings.lostActivityYears
  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1
  const lostCutoff = new Date()

  lostCutoff.setFullYear(lostCutoff.getFullYear() - lostActivityYears)

  const accounts = await db.query.companyAccount.findMany({
    where: accountIds
      ? and(
          eq(companyAccount.accountType, 'client'),
          inArray(companyAccount.id, accountIds),
        )
      : eq(companyAccount.accountType, 'client'),
    columns: {
      id: true,
      createdAt: true,
      isTarget: true,
      isLost: true,
    },
  })

  const scopedAccountIds = accounts.map((account) => account.id)

  if (scopedAccountIds.length === 0) {
    return { checked: 0, updated: 0, target: 0, regular: 0, lost: 0 }
  }

  const [
    grossProfitTotals,
    grossProfitActivity,
    forecastActivity,
    riskActivity,
    upsellingActivity,
    todoActivity,
    commentActivity,
  ] = await Promise.all([
    db
      .select({
        companyAccountId: accountGrossProfit.companyAccountId,
        total: sql<string>`coalesce(sum(${accountGrossProfit.value}), 0)`,
      })
      .from(accountGrossProfit)
      .where(
        and(
          inArray(accountGrossProfit.companyAccountId, scopedAccountIds),
          eq(accountGrossProfit.year, lastYear),
        ),
      )
      .groupBy(accountGrossProfit.companyAccountId),
    db
      .select({
        companyAccountId: accountGrossProfit.companyAccountId,
        lastActivityAt: sql<Date | null>`max(${accountGrossProfit.updatedAt})`,
      })
      .from(accountGrossProfit)
      .where(inArray(accountGrossProfit.companyAccountId, scopedAccountIds))
      .groupBy(accountGrossProfit.companyAccountId),
    db
      .select({
        companyAccountId: accountTargetForecast.companyAccountId,
        lastActivityAt: sql<Date | null>`max(${accountTargetForecast.updatedAt})`,
      })
      .from(accountTargetForecast)
      .where(inArray(accountTargetForecast.companyAccountId, scopedAccountIds))
      .groupBy(accountTargetForecast.companyAccountId),
    db
      .select({
        companyAccountId: accountRisk.companyAccountId,
        lastActivityAt: sql<Date | null>`max(${accountRisk.updatedAt})`,
      })
      .from(accountRisk)
      .where(inArray(accountRisk.companyAccountId, scopedAccountIds))
      .groupBy(accountRisk.companyAccountId),
    db
      .select({
        companyAccountId: accountUpsellingOpportunity.companyAccountId,
        lastActivityAt: sql<Date | null>`max(${accountUpsellingOpportunity.updatedAt})`,
      })
      .from(accountUpsellingOpportunity)
      .where(
        inArray(accountUpsellingOpportunity.companyAccountId, scopedAccountIds),
      )
      .groupBy(accountUpsellingOpportunity.companyAccountId),
    db
      .select({
        companyAccountId: todo.companyAccountId,
        lastActivityAt: sql<Date | null>`max(${todo.updatedAt})`,
      })
      .from(todo)
      .where(
        and(
          isNotNull(todo.companyAccountId),
          inArray(todo.companyAccountId, scopedAccountIds),
        ),
      )
      .groupBy(todo.companyAccountId),
    db
      .select({
        companyAccountId: comment.entityId,
        lastActivityAt: sql<Date | null>`max(${comment.updatedAt})`,
      })
      .from(comment)
      .where(
        and(
          eq(comment.entityType, 'companyAccount'),
          inArray(comment.entityId, scopedAccountIds),
        ),
      )
      .groupBy(comment.entityId),
  ])

  const grossProfitByAccount = new Map(
    grossProfitTotals.map((row) => [row.companyAccountId, Number(row.total)]),
  )
  const lastActivityByAccount = new Map(
    accounts.map((account) => [account.id, account.createdAt]),
  )

  const mergeActivity = (
    companyAccountId: string | null,
    value: Date | string | null,
  ) => {
    if (!companyAccountId || !value) return

    const next = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(next.getTime())) return

    const current = lastActivityByAccount.get(companyAccountId)
    if (!current || next > current) {
      lastActivityByAccount.set(companyAccountId, next)
    }
  }

  for (const activityRows of [
    grossProfitActivity,
    forecastActivity,
    riskActivity,
    upsellingActivity,
    todoActivity,
    commentActivity,
  ]) {
    for (const row of activityRows) {
      mergeActivity(row.companyAccountId, row.lastActivityAt)
    }
  }

  let updated = 0
  let target = 0
  let regular = 0
  let lost = 0

  await Promise.all(
    accounts.map(async (account) => {
      const grossProfit = grossProfitByAccount.get(account.id) ?? 0
      const nextIsTarget = grossProfit >= targetThreshold
      const lastActivityAt = lastActivityByAccount.get(account.id)
      const nextIsLost = lastActivityAt ? lastActivityAt < lostCutoff : true

      if (nextIsLost) {
        lost += 1
      } else if (nextIsTarget) {
        target += 1
      } else {
        regular += 1
      }

      if (account.isTarget === nextIsTarget && account.isLost === nextIsLost) {
        return
      }

      updated += 1

      await db
        .update(companyAccount)
        .set({
          isTarget: nextIsTarget,
          isLost: nextIsLost,
        })
        .where(eq(companyAccount.id, account.id))
    }),
  )

  return {
    checked: accounts.length,
    updated,
    target,
    regular,
    lost,
  }
}
