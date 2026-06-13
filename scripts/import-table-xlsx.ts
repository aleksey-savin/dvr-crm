/**
 * Импорт CRM-данных из рабочей Excel-таблицы отдела продаж (table.xlsx).
 *
 * Листы:
 *   ГКС / БОЛТ / RUSAPAI / ОРА → companyAccount (целевые / нецелевые / ушедшие / НБ)
 *     + accountGrossProfit (ВП 2025), accountTargetForecast (2026),
 *       accountRisk, accountUpsellingOpportunity, companyAccountManagers;
 *     ГКС: строки «План/факт … 2026» → salesPlan,
 *          колонки «<ФАМИЛИЯ> 2025» → grossProfitFact (2025-12-31).
 *   WISH-LIST → wishlist-аккаунты (+хуки, отрасль, позиция в рейтинге)
 *   Маркетолог → todos
 *
 * Запуск: pnpm db:import:xlsx <путь к table.xlsx> [--dry-run]
 * Подключение — только через DATABASE_URL (скрипт рассчитан на запуск на проде).
 * Идемпотентен: матчит компании/аккаунты по нормализованному имени и обновляет их.
 */
import './load-env'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { and, eq, like } from 'drizzle-orm'
import { db } from '@/db'
import {
  accountGrossProfit,
  accountHook,
  accountRisk,
  accountTargetForecast,
  accountUpsellingOpportunity,
  company,
  companyAccount,
  companyAccountDepartments,
  companyAccountManagers,
  grossProfitFact,
  industry,
  salesPlan,
  todo,
  todoResponsibleUsers,
  user,
} from '@/db/schema'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

const GPF_MARKER = 'Импорт из table.xlsx: ВП 2025'
const TODO_MARKER = '[import:xlsx]'

const BU_SHEETS = ['ГКС', 'БОЛТ', 'RUSAPAI', 'ОРА']

// Алиасы бизнес-юнитов файла → нормализованное имя департамента в БД
const UNIT_ALIASES: Record<string, string> = {
  дврегион: 'дв регион',
  'дв регион': 'дв регион',
  'дв региона': 'дв регион',
  rusapai: 'rusapai',
}

// Значения колонки «Клиентский менеджер», означающие департамент, а не человека
const UNIT_MANAGER_TOKENS: Record<string, string> = {
  'клиент дв региона': 'дв регион',
  хабаровск: 'хабаровск',
}

// Опечатки фамилий в файле
const SURNAME_ALIASES: Record<string, string> = {
  тимменчук: 'тименчук',
}

// Фамилии из файла, которых заведомо нет среди пользователей: для них всегда
// создаём заглушки (в т.ч. когда фамилия встречается в «чужой» колонке)
const KNOWN_MISSING_SURNAMES = new Set([
  'клеменчук',
  'жидких',
  'несина',
  'веремейчик',
  'ионина',
  'бунтуш',
  'свитто',
  'чертухина',
  'ревука',
  'мицай',
  'ашитков',
])

const MONTHS: Record<string, number> = {
  январь: 1,
  февраль: 2,
  март: 3,
  апрель: 4,
  май: 5,
  июнь: 6,
  июль: 7,
  август: 8,
  сентябрь: 9,
  октябрь: 10,
  ноябрь: 11,
  декабрь: 12,
}

// ---------------------------------------------------------------------------
// Утилиты
// ---------------------------------------------------------------------------

function norm(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim()
}

/**
 * Ключ для матчинга компаний: нормализация + сортировка частей вокруг «/»,
 * чтобы «ЛЕНТА/РЕМИ» и «Лента / Реми» давали один ключ.
 */
function companyKey(s: string): string {
  return norm(s)
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean)
    .sort()
    .join('/')
}

const TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

function translit(s: string): string {
  return [...norm(s)].map((ch) => TRANSLIT[ch] ?? ch).join('')
}

function asText(v: ExcelJS.CellValue): string {
  if (v == null) return ''
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === 'object') {
    if ('richText' in v)
      return v.richText
        .map((t) => t.text)
        .join('')
        .trim()
    if ('error' in v) return ''
    if ('result' in v) return asText(v.result as ExcelJS.CellValue)
    if ('text' in v) return asText(v.text as ExcelJS.CellValue)
    if ('hyperlink' in v) return String(v.hyperlink).trim()
  }
  return ''
}

function asNumber(v: ExcelJS.CellValue): number | null {
  if (v == null) return null
  if (typeof v === 'number') return v
  if (v instanceof Date) return null
  if (typeof v === 'object') {
    if ('error' in v) return null
    if ('result' in v) return asNumber((v as ExcelJS.CellFormulaValue).result)
    if ('richText' in v) v = asText(v)
  }
  if (typeof v === 'string') {
    const s = v.replace(/\s/g, '').replace(',', '.')
    if (s && /^-?\d+(\.\d+)?$/.test(s)) return Number(s)
  }
  return null
}

function joinNotes(lines: Array<string | null | undefined>): string | null {
  const joined = lines
    .filter((l): l is string => Boolean(l?.trim()))
    .join('\n\n')
  return joined || null
}

class DryRunRollback extends Error {}

// ---------------------------------------------------------------------------
// Контекст импорта
// ---------------------------------------------------------------------------

interface AccountRef {
  id: string
  companyId: string
  businessUnitId: string
  accountType: string
}

interface Ctx {
  tx: Tx
  wb: ExcelJS.Workbook
  departmentsByNorm: Map<string, { id: string; name: string }>
  usersBySurname: Map<string, { id: string; name: string }>
  companiesByKey: Map<string, { id: string; name: string }>
  accountsByCompanyUnit: Map<string, AccountRef>
  accountsByCompany: Map<string, Array<AccountRef>>
  industriesByNorm: Map<string, { id: string }>
  cleaned: Set<string> // "<table>:<accountId>" — чьи дочерние записи уже заменены
  counters: Record<string, number>
  createdUsers: Array<string>
  warnings: Set<string>
}

function bump(ctx: Ctx, key: string, by = 1) {
  ctx.counters[key] = (ctx.counters[key] ?? 0) + by
}

function warn(ctx: Ctx, message: string) {
  ctx.warnings.add(message)
}

async function buildContext(tx: Tx, wb: ExcelJS.Workbook): Promise<Ctx> {
  const departments = await tx.query.department.findMany()
  const users = await tx.query.user.findMany()
  const companies = await tx.query.company.findMany()
  const accounts = await tx.query.companyAccount.findMany()
  const industries = await tx.query.industry.findMany()

  const ctx: Ctx = {
    tx,
    wb,
    departmentsByNorm: new Map(departments.map((d) => [norm(d.name), d])),
    usersBySurname: new Map(),
    companiesByKey: new Map(companies.map((c) => [companyKey(c.name), c])),
    accountsByCompanyUnit: new Map(),
    accountsByCompany: new Map(),
    industriesByNorm: new Map(industries.map((i) => [norm(i.name), i])),
    cleaned: new Set(),
    counters: {},
    createdUsers: [],
    warnings: new Set(),
  }

  // Имена в БД встречаются и как «Имя Фамилия», и как «Фамилия Имя» (заглушки),
  // поэтому индексируем каждое слово; неоднозначные слова (например, общее имя
  // «Анастасия») выбрасываем из индекса
  const wordOwners = new Map<string, Set<string>>()
  for (const u of users) {
    for (const w of [...norm(u.name).split(' '), norm(u.name)]) {
      const owners = wordOwners.get(w) ?? new Set()
      owners.add(u.id)
      wordOwners.set(w, owners)
      ctx.usersBySurname.set(w, u)
    }
  }
  for (const [w, owners] of wordOwners) {
    if (owners.size > 1) ctx.usersBySurname.delete(w)
  }

  for (const a of accounts) {
    registerAccount(ctx, a)
  }
  return ctx
}

function registerAccount(ctx: Ctx, a: AccountRef) {
  ctx.accountsByCompanyUnit.set(`${a.companyId}|${a.businessUnitId}`, a)
  const list = ctx.accountsByCompany.get(a.companyId) ?? []
  if (!list.some((x) => x.id === a.id)) list.push(a)
  ctx.accountsByCompany.set(a.companyId, list)
}

// ---------------------------------------------------------------------------
// Справочники: департаменты, пользователи, индустрии, компании
// ---------------------------------------------------------------------------

function resolveUnit(ctx: Ctx, raw: string) {
  const key = UNIT_ALIASES[norm(raw)] ?? norm(raw)
  return ctx.departmentsByNorm.get(key) ?? null
}

async function resolveOrCreateUserBySurname(
  ctx: Ctx,
  rawToken: string,
): Promise<{ id: string } | null> {
  const token = rawToken.split(' - ')[0].trim()
  if (!token || token === '-') return null
  const words = norm(token).split(' ')
  for (const w of words) {
    const surname = SURNAME_ALIASES[w] ?? w
    const found = ctx.usersBySurname.get(surname)
    if (found) return found
  }
  // Незнакомая фамилия: создаём заглушку (1–2 кириллических слова,
  // каждое с заглавной буквы — отсекает перечисления обязанностей)
  const originalWords = token.split(/\s+/)
  if (
    originalWords.length > 2 ||
    !originalWords.every((w) => /^[А-ЯЁ][а-яёА-ЯЁ-]*$/.test(w))
  )
    return null
  const surname = SURNAME_ALIASES[words[0]] ?? words[0]
  const created = {
    id: crypto.randomUUID(),
    name: token,
    email: `${translit(surname)}@dvregion.ru`,
  }
  await ctx.tx.insert(user).values(created)
  ctx.usersBySurname.set(surname, created)
  ctx.createdUsers.push(`${created.name} <${created.email}>`)
  bump(ctx, 'usersCreated')
  return created
}

/**
 * Колонка «Клиентский менеджер»: «Якименко/Потапенко», «Матлак, Тименчук»,
 * «Шилова Настя - разработка+контент\nЧертухина Софья - …», «Клиент ДВ Региона».
 */
async function resolveManagers(ctx: Ctx, raw: string, source: string) {
  const userIds = new Set<string>()
  const unitIds = new Set<string>()
  for (const part of raw.split(/[/,;\n]+/)) {
    const token = part.trim()
    if (!token || token === '-') continue
    const unitKey = UNIT_MANAGER_TOKENS[norm(token)]
    if (unitKey) {
      const unit = ctx.departmentsByNorm.get(unitKey)
      if (unit) unitIds.add(unit.id)
      continue
    }
    const resolved = await resolveOrCreateUserBySurname(ctx, token)
    if (resolved) userIds.add(resolved.id)
    else warn(ctx, `Не распознан менеджер «${token}» (${source})`)
  }
  return { userIds: [...userIds], unitIds: [...unitIds] }
}

/**
 * Ячейка, в которой может оказаться менеджер, департамент, число или текст
 * (например «Потенциал на 2026» в блоке ушедших клиентов ГКС).
 */
function looksLikeSurname(ctx: Ctx, raw: string): boolean {
  const words = norm(raw).split(' ')
  if (words.length > 2) return false
  const surname = SURNAME_ALIASES[words[0]] ?? words[0]
  return ctx.usersBySurname.has(surname) || KNOWN_MISSING_SURNAMES.has(surname)
}

async function getOrCreateCompany(ctx: Ctx, name: string) {
  const key = companyKey(name)
  const existing = ctx.companiesByKey.get(key)
  if (existing) return existing
  const [created] = await ctx.tx
    .insert(company)
    .values({ name })
    .returning({ id: company.id, name: company.name })
  ctx.companiesByKey.set(key, created)
  bump(ctx, 'companiesCreated')
  return created
}

async function getOrCreateIndustry(ctx: Ctx, name: string) {
  const existing = ctx.industriesByNorm.get(norm(name))
  if (existing) return existing
  const [created] = await ctx.tx
    .insert(industry)
    .values({ name })
    .returning({ id: industry.id })
  ctx.industriesByNorm.set(norm(name), created)
  bump(ctx, 'industriesCreated')
  return created
}

interface AccountPatch {
  accountType: 'client' | 'wishlist' | 'prospect' | 'lost'
  isTarget?: boolean
  isLost?: boolean
  lostReasons?: string | null
  notes?: string | null
  position?: number | null
  wishlistState?: 'active' | 'basement' | 'archived' | null
  why?: string | null
  wishlistOffer?: string | null
  contactNotes?: string | null
}

async function upsertAccount(
  ctx: Ctx,
  companyId: string,
  businessUnitId: string,
  patch: AccountPatch,
): Promise<AccountRef> {
  const key = `${companyId}|${businessUnitId}`
  const existing = ctx.accountsByCompanyUnit.get(key)
  if (existing) {
    await ctx.tx
      .update(companyAccount)
      .set(patch)
      .where(eq(companyAccount.id, existing.id))
    existing.accountType = patch.accountType
    bump(ctx, 'accountsUpdated')
    return existing
  }
  const [created] = await ctx.tx
    .insert(companyAccount)
    .values({ companyId, businessUnitId, ...patch })
    .returning({
      id: companyAccount.id,
      companyId: companyAccount.companyId,
      businessUnitId: companyAccount.businessUnitId,
      accountType: companyAccount.accountType,
    })
  registerAccount(ctx, created)
  bump(ctx, 'accountsCreated')
  bump(ctx, `accounts:${patch.accountType}`)
  return created
}

/** Замена дочерних записей аккаунта (идемпотентность): чистим один раз за прогон. */
async function cleanOnce(
  ctx: Ctx,
  table: string,
  accountId: string,
  fn: () => Promise<unknown>,
) {
  const key = `${table}:${accountId}`
  if (ctx.cleaned.has(key)) return
  ctx.cleaned.add(key)
  await fn()
}

async function replaceYearValue(
  ctx: Ctx,
  kind: 'grossProfit' | 'forecast',
  accountId: string,
  year: number,
  value: number,
) {
  const table =
    kind === 'grossProfit' ? accountGrossProfit : accountTargetForecast
  await cleanOnce(ctx, kind + year, accountId, () =>
    ctx.tx
      .delete(table)
      .where(and(eq(table.companyAccountId, accountId), eq(table.year, year))),
  )
  await ctx.tx
    .insert(table)
    .values({ companyAccountId: accountId, year, value: String(value) })
  bump(ctx, kind === 'grossProfit' ? 'grossProfits' : 'forecasts')
}

async function replaceDescriptionRow(
  ctx: Ctx,
  kind: 'risk' | 'upsell' | 'hook',
  accountId: string,
  description: string,
) {
  const table =
    kind === 'risk'
      ? accountRisk
      : kind === 'upsell'
        ? accountUpsellingOpportunity
        : accountHook
  await cleanOnce(ctx, kind, accountId, () =>
    ctx.tx.delete(table).where(eq(table.companyAccountId, accountId)),
  )
  await ctx.tx
    .insert(table)
    .values({ companyAccountId: accountId, description })
  bump(ctx, `${kind}s`)
}

async function linkManagers(
  ctx: Ctx,
  accountId: string,
  userIds: Array<string>,
) {
  for (const userId of userIds) {
    await ctx.tx
      .insert(companyAccountManagers)
      .values({ companyAccountId: accountId, userId })
      .onConflictDoNothing()
    bump(ctx, 'managerLinks')
  }
}

async function linkDepartments(
  ctx: Ctx,
  accountId: string,
  unitIds: Array<string>,
) {
  for (const departmentId of unitIds) {
    await ctx.tx
      .insert(companyAccountDepartments)
      .values({ companyAccountId: accountId, departmentId })
      .onConflictDoNothing()
  }
}

// ---------------------------------------------------------------------------
// Листы бизнес-юнитов (ГКС / БОЛТ / RUSAPAI / ОРА)
// ---------------------------------------------------------------------------

interface ColMap {
  client?: number
  brand?: number
  gp2025?: number
  forecast?: number
  potential?: number
  risks?: number
  upsell?: number
  marketerTasks?: number
  managerTasks?: number
  manager?: number
  status?: number
  done?: number
  lostReason?: number
}

interface MgrCol {
  col: number
  surname: string
  year: number
}

function rowTexts(row: ExcelJS.Row): Map<number, string> {
  const out = new Map<number, string>()
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const t = asText(cell.value)
    if (t) out.set(colNumber, t)
  })
  return out
}

function parseHeader(texts: Map<number, string>): {
  cols: ColMap
  mgrCols: Array<MgrCol>
} {
  const cols: ColMap = {}
  const mgrCols: Array<MgrCol> = []
  for (const [col, raw] of texts) {
    const t = norm(raw)
    if (t === 'клиент') cols.client ??= col
    else if (t === 'бренд') cols.brand ??= col
    else if (t.includes('вп 2025')) cols.gp2025 ??= col
    else if (/^([а-яёa-z]+) (2025|2026)$/.test(t)) {
      // «МАТЛАК 2025» и т.п. — персональные колонки разбивки ВП (лист ГКС)
      const my = /^([а-яёa-z]+) (2025|2026)$/.exec(t)!
      mgrCols.push({ col, surname: my[1], year: Number(my[2]) })
    } else if (t.includes('статус прекращения')) cols.lostReason ??= col
    else if (t.includes('потенциал')) cols.potential ??= col
    else if (t.includes('цель') || t.includes('прогноз')) cols.forecast ??= col
    else if (t.includes('риски')) cols.risks ??= col
    else if (t.includes('возможности')) cols.upsell ??= col
    else if (t.includes('задачи маркетолога')) cols.marketerTasks ??= col
    else if (t.includes('задачи клиентского')) cols.managerTasks ??= col
    else if (t.includes('клиентский менеджер')) cols.manager ??= col
    else if (t.includes('текущий статус') || t.includes('комментарии'))
      cols.status ??= col
    else if (t.includes('уже сделано')) cols.done ??= col
  }
  return { cols, mgrCols }
}

async function importBusinessUnitSheet(ctx: Ctx, sheetName: string) {
  const ws = ctx.wb.getWorksheet(sheetName)
  if (!ws) {
    warn(ctx, `Лист «${sheetName}» не найден в файле`)
    return
  }
  const unit = resolveUnit(ctx, sheetName)
  if (!unit)
    throw new Error(`Департамент для листа «${sheetName}» не найден в БД`)

  type BlockKind = 'target' | 'nontarget' | 'lost' | 'prospect'
  let block: BlockKind | null = null
  let cols: ColMap = {}
  let mainBlockIndex = 0
  let sheetMgrCols: Array<MgrCol> = []
  let emptyStreak = 0

  for (let r = 1; r <= ws.rowCount; r++) {
    const texts = rowTexts(ws.getRow(r))
    if (texts.size === 0) {
      emptyStreak++
      // Хвост блока ушедших/НБ не имеет «Итого» — обрываем по серии пустых строк
      if (emptyStreak >= 4 && (block === 'lost' || block === 'prospect'))
        block = null
      continue
    }
    emptyStreak = 0
    const allText = norm([...texts.values()].join(' | '))

    // Строки «План/факт ЦЕЛЕВЫЕ/НЕЦЕЛЕВЫЕ 2026» (только ГКС) → salesPlan
    if (allText.includes('план/факт')) {
      await importSalesPlanRow(
        ctx,
        ws.getRow(r),
        allText,
        unit.id,
        sheetMgrCols,
        sheetName,
      )
      continue
    }

    const header = parseHeader(texts)
    if (header.cols.client && header.cols.gp2025) {
      block = mainBlockIndex === 0 ? 'target' : 'nontarget'
      mainBlockIndex++
      cols = header.cols
      if (header.mgrCols.length > 0) sheetMgrCols = header.mgrCols
      continue
    }
    if (header.cols.client && header.cols.lostReason) {
      block = 'lost'
      cols = header.cols
      continue
    }
    if (allText.includes('клиенты нб')) {
      block = 'prospect' // секция «Клиенты НБ БОЛТ»: колонки те же, что в lost-блоке
      continue
    }
    if (!block || !cols.client) continue

    const name = texts.get(cols.client) ?? ''
    if (!name) continue
    if (norm(name) === 'итого' || norm(name) === 'средний чек') {
      if (block === 'target' || block === 'nontarget') block = null
      continue
    }

    await importBusinessUnitRow(
      ctx,
      ws.getRow(r),
      texts,
      cols,
      block,
      unit.id,
      sheetMgrCols,
      sheetName,
    )
  }
}

async function importBusinessUnitRow(
  ctx: Ctx,
  row: ExcelJS.Row,
  texts: Map<number, string>,
  cols: ColMap,
  block: 'target' | 'nontarget' | 'lost' | 'prospect',
  unitId: string,
  mgrCols: Array<MgrCol>,
  sheetName: string,
) {
  const cellText = (col?: number) => (col ? (texts.get(col) ?? '') : '')
  const cellNumber = (col?: number) =>
    col ? asNumber(row.getCell(col).value) : null

  const rawName = cellText(cols.client)
  const brand = cellText(cols.brand)
  const name = brand ? `${rawName} — ${brand}` : rawName

  const managerIds = new Set<string>()
  const extraUnitIds = new Set<string>()
  const noteLines: Array<string> = []
  let lostReason: string | null = null
  let potentialNumber: number | null = null

  if (cols.manager && cellText(cols.manager)) {
    const { userIds, unitIds } = await resolveManagers(
      ctx,
      cellText(cols.manager),
      `${sheetName}, ${rawName}`,
    )
    userIds.forEach((id) => managerIds.add(id))
    unitIds.forEach((id) => extraUnitIds.add(id))
  }

  // «Статус прекращения»: в БОЛТ туда иногда вписан менеджер («Бунтуш Андрей»)
  const lostReasonRaw = cellText(cols.lostReason)
  if (lostReasonRaw) {
    if (looksLikeSurname(ctx, lostReasonRaw)) {
      const u = await resolveOrCreateUserBySurname(ctx, lostReasonRaw)
      if (u) managerIds.add(u.id)
    } else {
      lostReason = lostReasonRaw
    }
  }

  // «Потенциал на 2026» (lost-блок): число → прогноз; фамилия → менеджер;
  // департамент → привязка к юниту; текст → в заметки
  const potentialRaw = cellText(cols.potential)
  if (potentialRaw) {
    const num = cellNumber(cols.potential)
    const unitRef = resolveUnit(ctx, potentialRaw)
    if (num !== null) {
      potentialNumber = num
    } else if (looksLikeSurname(ctx, potentialRaw)) {
      const u = await resolveOrCreateUserBySurname(ctx, potentialRaw)
      if (u) managerIds.add(u.id)
    } else if (unitRef) {
      extraUnitIds.add(unitRef.id)
    } else {
      noteLines.push(`Потенциал на 2026: ${potentialRaw}`)
    }
  }

  if (brand) noteLines.unshift(`Бренд: ${brand}`)
  if (cellText(cols.status)) noteLines.push(cellText(cols.status))
  if (cellText(cols.marketerTasks))
    noteLines.push(`Задачи маркетолога: ${cellText(cols.marketerTasks)}`)
  if (cellText(cols.managerTasks))
    noteLines.push(
      `Задачи клиентского менеджера: ${cellText(cols.managerTasks)}`,
    )
  if (cellText(cols.done)) noteLines.push(`Уже сделано: ${cellText(cols.done)}`)

  const comp = await getOrCreateCompany(ctx, name)
  const account = await upsertAccount(ctx, comp.id, unitId, {
    accountType:
      block === 'lost' ? 'lost' : block === 'prospect' ? 'prospect' : 'client',
    isTarget: block === 'target',
    isLost: block === 'lost',
    lostReasons: lostReason,
    notes: joinNotes(noteLines),
    wishlistState: null,
  })

  const gp = cellNumber(cols.gp2025)
  if (gp !== null && gp > 0)
    await replaceYearValue(ctx, 'grossProfit', account.id, 2025, gp)

  const forecast = cellNumber(cols.forecast) ?? potentialNumber
  if (forecast !== null)
    await replaceYearValue(ctx, 'forecast', account.id, 2026, forecast)

  if (cellText(cols.risks))
    await replaceDescriptionRow(ctx, 'risk', account.id, cellText(cols.risks))
  if (cellText(cols.upsell))
    await replaceDescriptionRow(
      ctx,
      'upsell',
      account.id,
      cellText(cols.upsell),
    )

  await linkManagers(ctx, account.id, [...managerIds])
  await linkDepartments(ctx, account.id, [...extraUnitIds])

  // ГКС: персональные колонки «<ФАМИЛИЯ> 2025» → grossProfitFact
  if (block === 'target' || block === 'nontarget') {
    for (const mc of mgrCols) {
      if (mc.year !== 2025) continue
      if (resolveUnit(ctx, mc.surname)) continue // итоговая колонка «ГКС 2025»
      const amount = asNumber(row.getCell(mc.col).value)
      if (amount === null || amount <= 0) continue
      const manager = await resolveOrCreateUserBySurname(ctx, mc.surname)
      if (!manager) {
        warn(
          ctx,
          `Не распознан менеджер «${mc.surname}» в разбивке ВП (${sheetName})`,
        )
        continue
      }
      await ctx.tx.insert(grossProfitFact).values({
        companyAccountId: account.id,
        amount: amount.toFixed(2),
        factDate: '2025-12-31',
        managerUserId: manager.id,
        departmentId: unitId,
        source: 'manual',
        description: GPF_MARKER,
      })
      bump(ctx, 'grossProfitFacts')
    }
  }
}

/**
 * Строка «План/факт ЦЕЛЕВЫЕ 2026» / «План/факт НЕЦЕЛЕВЫЕ 2026» (лист ГКС).
 * План каждого менеджера записан в его колонке «<ФАМИЛИЯ> 2025»
 * (в колонке «<ФАМИЛИЯ> 2026» — формула-сумма прогнозов, её не берём).
 */
async function importSalesPlanRow(
  ctx: Ctx,
  row: ExcelJS.Row,
  allText: string,
  unitId: string,
  mgrCols: Array<MgrCol>,
  sheetName: string,
) {
  const segment = allText.includes('нецелевые')
    ? 'nontarget'
    : allText.includes('целевые')
      ? 'target'
      : null
  if (!segment) return
  const yearMatch = /20\d{2}/.exec(allText)
  const year = yearMatch ? Number(yearMatch[0]) : 2026

  for (const mc of mgrCols) {
    if (mc.year !== 2025) continue
    if (resolveUnit(ctx, mc.surname)) continue
    const value = asNumber(row.getCell(mc.col).value)
    if (value === null) continue
    const manager = await resolveOrCreateUserBySurname(ctx, mc.surname)
    if (!manager) {
      warn(
        ctx,
        `Не распознан менеджер «${mc.surname}» в строке плана (${sheetName})`,
      )
      continue
    }
    await ctx.tx
      .insert(salesPlan)
      .values({
        departmentId: unitId,
        userId: manager.id,
        year,
        segment,
        value: String(value),
      })
      .onConflictDoUpdate({
        target: [
          salesPlan.departmentId,
          salesPlan.userId,
          salesPlan.year,
          salesPlan.segment,
        ],
        set: { value: String(value) },
      })
    bump(ctx, 'salesPlans')
  }
}

// ---------------------------------------------------------------------------
// WISH-LIST
// ---------------------------------------------------------------------------

const WL = {
  section: 1,
  num: 2,
  client: 3,
  unit: 4,
  industry: 5,
  revenue: 6,
  ranking: 7,
  why: 8,
  hooks: 9,
  offer: 10,
  contacts: 11,
  comments: 12,
  responsible: 13,
}

async function importWishlist(ctx: Ctx) {
  const ws = ctx.wb.getWorksheet('WISH-LIST')
  if (!ws) {
    warn(ctx, 'Лист «WISH-LIST» не найден в файле')
    return
  }
  const fallbackUnit = ctx.departmentsByNorm.get('дв регион')
  if (!fallbackUnit) throw new Error('Департамент «ДВ Регион» не найден в БД')

  let state: 'active' | 'basement' = 'active'
  let emptyStreak = 0

  for (let r = 5; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const texts = rowTexts(row)
    const section = norm(texts.get(WL.section) ?? '')
    if (section.includes('подвал')) state = 'basement'

    let name = texts.get(WL.client) ?? ''
    if (!name) {
      emptyStreak++
      if (emptyStreak >= 10) break
      continue
    }
    emptyStreak = 0

    let v = {
      unit: texts.get(WL.unit) ?? '',
      industry: texts.get(WL.industry) ?? '',
      revenue: texts.get(WL.revenue) ?? '',
      ranking: texts.get(WL.ranking) ?? '',
      why: texts.get(WL.why) ?? '',
      hooks: texts.get(WL.hooks) ?? '',
      offer: texts.get(WL.offer) ?? '',
      contacts: texts.get(WL.contacts) ?? '',
      comments: texts.get(WL.comments) ?? '',
      responsible: texts.get(WL.responsible) ?? '',
    }

    // Строка «Планета Здоровья» заполнена со сдвигом колонок — ручной фикс
    if (asNumber(row.getCell(WL.unit).value) !== null) {
      v = {
        unit: texts.get(WL.industry + 1) ?? '', // «RUSAPAI/ДВ Регион» в колонке выручки
        industry: texts.get(WL.industry) ?? '',
        revenue: '',
        ranking: '',
        why: texts.get(WL.why) ?? '',
        hooks: '',
        offer: joinNotes([texts.get(WL.offer), texts.get(WL.contacts)]) ?? '',
        contacts: texts.get(WL.responsible) ?? '',
        comments:
          joinNotes([texts.get(WL.comments), texts.get(WL.responsible + 1)]) ??
          '',
        responsible: '',
      }
      warn(
        ctx,
        `WISH-LIST: строка ${r} («${name}») импортирована с ручным фиксом сдвига колонок`,
      )
    }

    name = name.trim()
    const units = v.unit
      .split('/')
      .map((p) => resolveUnit(ctx, p.trim()))
      .filter((u): u is NonNullable<typeof u> => Boolean(u))
    if (v.unit && units.length === 0)
      warn(ctx, `WISH-LIST: не распознан бизнес-юнит «${v.unit}» («${name}»)`)
    const primaryUnit = units[0] ?? fallbackUnit

    const comp = await getOrCreateCompany(ctx, name)
    if (v.industry) {
      const ind = await getOrCreateIndustry(ctx, v.industry)
      await ctx.tx
        .update(company)
        .set({
          industryId: ind.id,
          regionalMarketPosition: v.ranking || undefined,
        })
        .where(eq(company.id, comp.id))
    } else if (v.ranking) {
      await ctx.tx
        .update(company)
        .set({ regionalMarketPosition: v.ranking })
        .where(eq(company.id, comp.id))
    }

    // Если аккаунт в этом юните уже импортирован из БЮ-листа как клиент,
    // не понижаем его до wishlist — только дополняем wishlist-поля
    const existing = ctx.accountsByCompanyUnit.get(
      `${comp.id}|${primaryUnit.id}`,
    )
    let account: AccountRef
    if (existing && existing.accountType !== 'wishlist') {
      await ctx.tx
        .update(companyAccount)
        .set({
          why: v.why || null,
          wishlistOffer: v.offer || null,
          contactNotes: v.contacts || null,
        })
        .where(eq(companyAccount.id, existing.id))
      account = existing
      bump(ctx, 'wishlistMergedIntoClient')
    } else {
      account = await upsertAccount(ctx, comp.id, primaryUnit.id, {
        accountType: 'wishlist',
        wishlistState: state,
        position: asNumber(row.getCell(WL.num).value),
        why: v.why || null,
        wishlistOffer: v.offer || null,
        contactNotes: v.contacts || null,
        notes: joinNotes([
          v.comments,
          v.revenue ? `Выручка 2025/2024: ${v.revenue}` : null,
        ]),
      })
    }

    if (v.hooks) await replaceDescriptionRow(ctx, 'hook', account.id, v.hooks)
    await linkDepartments(
      ctx,
      account.id,
      units.map((u) => u.id),
    )
    if (v.responsible) {
      const { userIds, unitIds } = await resolveManagers(
        ctx,
        v.responsible,
        `WISH-LIST, ${name}`,
      )
      await linkManagers(ctx, account.id, userIds)
      await linkDepartments(ctx, account.id, unitIds)
    }
  }
}

// ---------------------------------------------------------------------------
// Маркетолог → todos
// ---------------------------------------------------------------------------

function monthEnd(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0, 12)) // последний день месяца
}

async function importMarketerTodos(ctx: Ctx) {
  const ws = ctx.wb.getWorksheet('Маркетолог')
  if (!ws) {
    warn(ctx, 'Лист «Маркетолог» не найден в файле')
    return
  }
  const fallbackUnit = ctx.departmentsByNorm.get('дв регион')
  if (!fallbackUnit) throw new Error('Департамент «ДВ Регион» не найден в БД')
  const marketer = await resolveOrCreateUserBySurname(ctx, 'Гриднева')
  if (!marketer)
    throw new Error('Не удалось определить пользователя-маркетолога (Гриднева)')

  // Идемпотентность: подчищаем todos прошлых импортов по маркеру
  await ctx.tx.delete(todo).where(like(todo.description, `${TODO_MARKER}%`))

  let deadline = monthEnd(2026, 2)

  for (let r = 2; r <= ws.rowCount; r++) {
    const texts = rowTexts(ws.getRow(r))
    if (texts.size === 0) continue

    const maybeMonth = norm(texts.get(1) ?? texts.get(2) ?? '')
    if (texts.size === 1 && MONTHS[maybeMonth]) {
      deadline = monthEnd(2026, MONTHS[maybeMonth])
      continue
    }

    const client = texts.get(2) ?? ''
    const task = texts.get(3) ?? ''
    if (!client && !task) continue
    if (norm(client) === 'клиент') continue // заголовок

    const statusRaw = norm(texts.get(4) ?? '')
    const status = statusRaw.includes('готово')
      ? 'completed'
      : statusRaw.includes('в работе')
        ? 'in progress'
        : 'not started'
    const cancelled = statusRaw.includes('отмена')

    // Привязка к аккаунту по имени клиента (многие строки — не клиенты, это ок)
    const comp = ctx.companiesByKey.get(companyKey(client))
    const accounts = comp ? (ctx.accountsByCompany.get(comp.id) ?? []) : []
    const account =
      accounts.find((a) => a.accountType === 'client') ??
      (accounts.length > 0 ? accounts[0] : undefined)

    const description = joinNotes([
      TODO_MARKER,
      client && task ? `Клиент: ${client}` : null,
      texts.get(5) ? `Комментарии: ${texts.get(5)}` : null,
      texts.get(6) ? `Результат: ${texts.get(6)}` : null,
      texts.get(7) ? `Техническое описание: ${texts.get(7)}` : null,
    ])

    const [created] = await ctx.tx
      .insert(todo)
      .values({
        name: task || client,
        description,
        status,
        departmentId: account?.businessUnitId ?? fallbackUnit.id,
        companyAccountId: account?.id ?? null,
        createdBy: marketer.id,
        deadline,
        completedAt: status === 'completed' ? deadline : null,
        archivedAt: cancelled ? new Date() : null,
      })
      .returning({ id: todo.id })
    await ctx.tx
      .insert(todoResponsibleUsers)
      .values({ todoId: created.id, userId: marketer.id })
    bump(ctx, 'todos')
  }
}

// ---------------------------------------------------------------------------
// Точка входа
// ---------------------------------------------------------------------------

function printSummary(ctx: Ctx) {
  console.log('\n=== Сводка импорта ===')
  for (const [key, value] of Object.entries(ctx.counters).sort()) {
    console.log(`  ${key}: ${value}`)
  }
  if (ctx.createdUsers.length > 0) {
    console.log('\nСозданные пользователи-заглушки:')
    for (const u of ctx.createdUsers) console.log(`  + ${u}`)
  }
  if (ctx.warnings.size > 0) {
    console.log('\nПредупреждения:')
    for (const w of ctx.warnings) console.log(`  ! ${w}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const filePath = args.find((a) => !a.startsWith('--'))
  if (!filePath) {
    console.error(
      'Использование: pnpm db:import:xlsx <путь к table.xlsx> [--dry-run]',
    )
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) {
    console.error('Не задан DATABASE_URL')
    process.exit(1)
  }

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(path.resolve(filePath))

  try {
    await db.transaction(async (tx) => {
      const ctx = await buildContext(tx, wb)
      // Идемпотентность: факты прошлых импортов удаляем целиком по маркеру
      await tx
        .delete(grossProfitFact)
        .where(eq(grossProfitFact.description, GPF_MARKER))
      for (const sheetName of BU_SHEETS) {
        await importBusinessUnitSheet(ctx, sheetName)
      }
      await importWishlist(ctx)
      await importMarketerTodos(ctx)
      printSummary(ctx)
      if (dryRun) throw new DryRunRollback()
    })
    console.log('\nИмпорт завершён, изменения сохранены.')
  } catch (err) {
    if (err instanceof DryRunRollback) {
      console.log('\nDRY RUN: транзакция откатана, база не изменена.')
    } else {
      throw err
    }
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
