import { db } from '@/db'
import {
  company,
  companyAccount,
  companyAccountManagers,
  department,
  todo,
  todoResponsibleUsers,
  user,
} from '@/db/schema'
import type { Todo } from '@/types'
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { and, asc, eq } from 'drizzle-orm'
import * as z from 'zod'
import { recalculateClientClassifications } from '@/lib/client-classification'
import { buildDepartmentScopeFilter } from '@/lib/department-scope'

const todoInputSchema = z.object({
  name: z.string().min(2, 'Задача должна содержать минимум 2 символа'),
  description: z
    .string()
    .min(2, 'Описание должно содержать минимум 2 символа')
    .optional(),
  departmentId: z.string().uuid(),
  responsibles: z.array(z.string()).optional(),
  createdBy: z.string(),
  deadline: z.string().optional(),
  clientId: z.string().optional(),
  wishlistClientId: z.string().optional(),
})

const updateTodoSchema = todoInputSchema.extend({
  id: z.string(),
})

export const fetchTodos = createServerFn().handler(
  async (): Promise<Todo[]> => {
    const deptFilter = await buildDepartmentScopeFilter(todo.departmentId)
    const rows = await db.query.todo.findMany({
      where: deptFilter,
      with: {
        creator: { columns: { name: true } },
        department: { columns: { name: true } },
        companyAccount: {
          columns: { id: true, accountType: true },
          with: {
            company: { columns: { name: true } },
          },
        },
        responsibleUsers: {
          with: {
            user: { columns: { name: true } },
          },
        },
      },
    })

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      client: row.companyAccount
        ? {
            id: row.companyAccount.id,
            name: row.companyAccount.company.name,
            accountType: row.companyAccount.accountType,
          }
        : null,
      creator: row.creator.name,
      createdAt: row.createdAt,
      responsibles: row.responsibleUsers.map(
        ({ user: responsibleUser }) => responsibleUser.name,
      ),
      deadline: row.deadline,
      status: row.status as Todo['status'],
      completedAt: row.completedAt,
      departmentId: row.departmentId,
      department: row.department.name,
    }))
  },
)

export const fetchTodo = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const task = await db.query.todo.findFirst({
      where: eq(todo.id, data.id),
      with: {
        creator: {
          columns: { name: true, image: true },
        },
        responsibleUsers: {
          with: {
            user: {
              columns: { name: true, image: true, id: true },
            },
          },
        },
      },
    })

    if (!task) throw notFound()
    return task
  })

export const getEntityManagers = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      clientId: z.string().optional(),
      wishlistClientId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const accountId = data.clientId ?? data.wishlistClientId
    if (!accountId) return []

    const managers = await db
      .select({ userId: companyAccountManagers.userId })
      .from(companyAccountManagers)
      .where(eq(companyAccountManagers.companyAccountId, accountId))

    if (managers.length > 0) {
      return managers.map((manager) => manager.userId)
    }

    const account = await db.query.companyAccount.findFirst({
      columns: { ownerUserId: true },
      where: eq(companyAccount.id, accountId),
    })
    return account?.ownerUserId ? [account.ownerUserId] : []
  })

export const getUsers = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ departmentId: z.string() }))
  .handler(async ({ data }) => {
    return db
      .select({ id: user.id, name: user.name, role: user.role })
      .from(user)
      .where(eq(user.departmentId, data.departmentId))
      .orderBy(user.name)
  })

export const getDepartments = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select({ id: department.id, name: department.name })
      .from(department)
      .orderBy(department.name)
  },
)

export const getClients = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ departmentId: z.string().optional() }))
  .handler(async ({ data }) => {
    return db
      .select({
        id: companyAccount.id,
        companyName: company.name,
      })
      .from(companyAccount)
      .innerJoin(company, eq(companyAccount.companyId, company.id))
      .where(
        and(
          eq(companyAccount.accountType, 'client'),
          data.departmentId
            ? eq(companyAccount.businessUnitId, data.departmentId)
            : undefined,
        ),
      )
      .orderBy(asc(company.name))
  })

export const addTodo = createServerFn({ method: 'POST' })
  .inputValidator(todoInputSchema)
  .handler(async ({ data }) => {
    const companyAccountId = data.clientId ?? data.wishlistClientId
    const [inserted] = await db
      .insert(todo)
      .values({
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        departmentId: data.departmentId,
        companyAccountId,
        ...(data.deadline ? { deadline: new Date(data.deadline) } : {}),
      })
      .returning({ id: todo.id })

    if (companyAccountId) {
      await recalculateClientClassifications([companyAccountId])
    }

    return inserted.id
  })

export const updateTodo = createServerFn({ method: 'POST' })
  .inputValidator(updateTodoSchema)
  .handler(async ({ data }) => {
    const companyAccountId = data.clientId ?? data.wishlistClientId ?? null
    const existing = (
      await db
        .select({ companyAccountId: todo.companyAccountId })
        .from(todo)
        .where(eq(todo.id, data.id))
        .limit(1)
    ).at(0)

    await db
      .update(todo)
      .set({
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        departmentId: data.departmentId,
        companyAccountId,
        ...(data.deadline ? { deadline: new Date(data.deadline) } : {}),
      })
      .where(eq(todo.id, data.id))

    const affectedAccountIds = Array.from(
      new Set([existing?.companyAccountId, companyAccountId].filter(Boolean)),
    ) as string[]

    await recalculateClientClassifications(affectedAccountIds)
  })

export const setResponsibleUsers = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      todoId: z.string(),
      userIds: z.array(z.string()),
    }),
  )
  .handler(async ({ data }) => {
    await db
      .delete(todoResponsibleUsers)
      .where(eq(todoResponsibleUsers.todoId, data.todoId))

    if (data.userIds.length > 0) {
      await db.insert(todoResponsibleUsers).values(
        data.userIds.map((userId) => ({
          todoId: data.todoId,
          userId,
        })),
      )
    }
  })

export const getTodoResponsibles = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ todoId: z.string() }))
  .handler(async ({ data }) => {
    return db
      .select({ id: user.id, name: user.name, role: user.role })
      .from(todoResponsibleUsers)
      .innerJoin(user, eq(todoResponsibleUsers.userId, user.id))
      .where(eq(todoResponsibleUsers.todoId, data.todoId))
  })

export const updateTodoStatus = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string().min(1),
      status: z.enum(['not started', 'in progress', 'completed']),
      completedAt: z.date().nullable(),
      archivedAt: z.date().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const existing = (
      await db
        .select({ companyAccountId: todo.companyAccountId })
        .from(todo)
        .where(eq(todo.id, data.id))
        .limit(1)
    ).at(0)

    await db
      .update(todo)
      .set({
        status: data.status,
        completedAt: data.completedAt,
        archivedAt: data.archivedAt,
      })
      .where(eq(todo.id, data.id))

    if (existing?.companyAccountId) {
      await recalculateClientClassifications([existing.companyAccountId])
    }
  })

export const deleteTodo = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    const existing = (
      await db
        .select({ companyAccountId: todo.companyAccountId })
        .from(todo)
        .where(eq(todo.id, id))
        .limit(1)
    ).at(0)

    await db.delete(todo).where(eq(todo.id, id))

    if (existing?.companyAccountId) {
      await recalculateClientClassifications([existing.companyAccountId])
    }
  })
