import { db } from '@/db'
import { department, user } from '@/db/schema'
import type { ParentDepartmentOption, ParentDepartmentRow } from '@/types'
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import * as z from 'zod'

const parentIdSchema = z.union([z.string().uuid(), z.undefined()])
const headUserIdSchema = z.union([z.string().min(1), z.undefined()])
const accentColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Цвет должен быть в формате #RRGGBB')

const addDepartmentSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  headUserId: headUserIdSchema,
  description: z
    .string()
    .min(2, 'Описание должно содержать минимум 2 символа')
    .optional(),
  accentColor: accentColorSchema,
  parentId: parentIdSchema,
})

const updateDepartmentSchema = addDepartmentSchema.extend({
  id: z.string(),
})

function getExcludedDepartmentIds(
  rows: ParentDepartmentRow[],
  excludeId?: string,
) {
  const excludedIds = new Set<string>()
  if (!excludeId) return excludedIds

  const childrenByParentId = new Map<string, ParentDepartmentRow[]>()
  for (const row of rows) {
    if (!row.parentId) continue
    const siblings = childrenByParentId.get(row.parentId) ?? []
    siblings.push(row)
    childrenByParentId.set(row.parentId, siblings)
  }

  const stack = [excludeId]
  while (stack.length > 0) {
    const id = stack.pop()
    if (!id || excludedIds.has(id)) continue

    excludedIds.add(id)
    for (const child of childrenByParentId.get(id) ?? []) {
      stack.push(child.id)
    }
  }

  return excludedIds
}

function buildParentDepartmentOptions(
  rows: ParentDepartmentRow[],
  excludeId?: string,
) {
  const excludedIds = getExcludedDepartmentIds(rows, excludeId)
  const allowedRows = rows.filter((row) => !excludedIds.has(row.id))
  const allowedIds = new Set(allowedRows.map((row) => row.id))
  const childrenByParentId = new Map<string | null, ParentDepartmentRow[]>()

  for (const row of allowedRows) {
    const parentId =
      row.parentId && allowedIds.has(row.parentId) ? row.parentId : null
    const siblings = childrenByParentId.get(parentId) ?? []
    siblings.push(row)
    childrenByParentId.set(parentId, siblings)
  }

  for (const siblings of childrenByParentId.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }

  const options: ParentDepartmentOption[] = []
  const appendOptions = (items: ParentDepartmentRow[], depth: number) => {
    for (const item of items) {
      options.push({ ...item, depth })
      appendOptions(childrenByParentId.get(item.id) ?? [], depth + 1)
    }
  }

  appendOptions(childrenByParentId.get(null) ?? [], 0)
  return options
}

async function validateDepartmentParent(
  parentId?: string,
  departmentId?: string,
) {
  if (!parentId) return null

  if (departmentId && parentId === departmentId) {
    throw new Error('Подразделение не может быть родителем самого себя')
  }

  const rows = await db
    .select({
      id: department.id,
      name: department.name,
      parentId: department.parentId,
    })
    .from(department)
    .orderBy(department.name)

  const byId = new Map(rows.map((row) => [row.id, row]))
  if (!byId.has(parentId)) {
    throw new Error('Родительское подразделение не найден')
  }

  const visitedIds = new Set<string>()
  let currentParentId: string | null = parentId

  while (currentParentId) {
    if (departmentId && currentParentId === departmentId) {
      throw new Error(
        'Нельзя перенести подразделение внутрь его дочернего подразделения',
      )
    }

    if (visitedIds.has(currentParentId)) {
      throw new Error('В иерархии подразделений обнаружен цикл')
    }

    visitedIds.add(currentParentId)
    currentParentId = byId.get(currentParentId)?.parentId ?? null
  }

  return parentId
}

async function validateDepartmentHead(headUserId?: string) {
  if (!headUserId) return null

  const head = await db.query.user.findFirst({
    columns: { id: true },
    where: eq(user.id, headUserId),
  })

  if (!head) {
    throw new Error('Руководитель не найден')
  }

  return headUserId
}

export const fetchMyCompanyData = createServerFn().handler(async () => {
  const [departments, users] = await Promise.all([
    db.query.department.findMany({
      with: {
        head: {
          columns: {
            id: true,
            name: true,
            role: true,
            image: true,
          },
        },
        users: {
          columns: {
            id: true,
            name: true,
            role: true,
            image: true,
          },
        },
      },
      orderBy: (departmentTable, { asc }) => [asc(departmentTable.name)],
    }),
    db.query.user.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
      },
      with: {
        sessions: {
          columns: {
            updatedAt: true,
          },
          orderBy: (session, { desc }) => [desc(session.updatedAt)],
          limit: 1,
        },
      },
      orderBy: (userTable, { asc }) => [asc(userTable.name)],
    }),
  ])

  return {
    departments,
    users: users.map((appUser) => ({
      id: appUser.id,
      name: appUser.name,
      email: appUser.email,
      mobileNumber: null,
      lastActivityAt: appUser.sessions.at(0)?.updatedAt ?? null,
    })),
  }
})

export const fetchDepartment = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const item = await db.query.department.findFirst({
      where: eq(department.id, data.id),
    })

    if (!item) throw notFound()
    return item
  })

export const fetchDepartmentOptions = createServerFn({
  method: 'GET',
}).handler(async () => {
  return db
    .select({ id: department.id, name: department.name })
    .from(department)
    .orderBy(department.name)
})

export const fetchSidebarDepartments = createServerFn({
  method: 'GET',
}).handler(async () => {
  return db.query.department.findMany({
    columns: { id: true, name: true, accentColor: true },
    orderBy: (departmentTable, { asc }) => [asc(departmentTable.name)],
  })
})

export const fetchParentDepartmentOptions = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ excludeId: z.string().optional() }))
  .handler(async ({ data }) => {
    const rows = await db
      .select({
        id: department.id,
        name: department.name,
        parentId: department.parentId,
      })
      .from(department)
      .orderBy(department.name)

    return buildParentDepartmentOptions(rows, data.excludeId)
  })

export const fetchHeadUserOptions = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select({
        id: user.id,
        name: user.name,
        role: user.role,
      })
      .from(user)
      .orderBy(user.name)
  },
)

export const addDepartment = createServerFn({ method: 'POST' })
  .inputValidator(addDepartmentSchema)
  .handler(async ({ data }) => {
    const parentId = await validateDepartmentParent(data.parentId)
    const headUserId = await validateDepartmentHead(data.headUserId)

    const [inserted] = await db
      .insert(department)
      .values({
        name: data.name,
        headUserId,
        description: data.description,
        accentColor: data.accentColor,
        parentId,
      })
      .returning({ id: department.id })

    return inserted.id
  })

export const updateDepartment = createServerFn({ method: 'POST' })
  .inputValidator(updateDepartmentSchema)
  .handler(async ({ data }) => {
    const parentId = await validateDepartmentParent(data.parentId, data.id)
    const headUserId = await validateDepartmentHead(data.headUserId)

    await db
      .update(department)
      .set({
        name: data.name,
        headUserId,
        description: data.description,
        accentColor: data.accentColor,
        parentId,
      })
      .where(eq(department.id, data.id))
  })

export const deleteDepartment = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    const child = await db.query.department.findFirst({
      columns: { id: true },
      where: eq(department.parentId, id),
    })

    if (child) {
      throw new Error('Сначала перенесите или удалите дочерние подразделения')
    }

    await db.delete(department).where(eq(department.id, id))
  })
