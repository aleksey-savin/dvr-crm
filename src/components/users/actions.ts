import { db } from '@/db'
import { user as userTable } from '@/db/schema'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { auth } from 'utils/auth'
import * as z from 'zod'

export const fetchUsers = createServerFn().handler(async () => {
  const request = getRequest()
  return auth.api.listUsers({
    query: {
      limit: 100,
      sortBy: 'name',
      sortDirection: 'desc',
    },
    headers: request.headers,
  })
})

export const fetchUser = createServerFn()
  .inputValidator(z.string())
  .handler(async ({ data: userId }) => {
    const request = getRequest()
    const [authUser, dbRow] = await Promise.all([
      auth.api.getUser({ query: { id: userId }, headers: request.headers }),
      db
        .select({
          departmentId: userTable.departmentId,
          position: userTable.position,
          phone: userTable.phone,
        })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .then((rows) => rows.at(0)),
    ])

    return {
      ...authUser,
      departmentId: dbRow?.departmentId ?? null,
      position: dbRow?.position ?? null,
      phone: dbRow?.phone ?? null,
    }
  })

export const setUserProfileFields = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      userId: z.string(),
      position: z.string().trim().nullable(),
      phone: z.string().trim().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    await db
      .update(userTable)
      .set({
        position: data.position || null,
        phone: data.phone || null,
      })
      .where(eq(userTable.id, data.userId))
  })

export const setUserDepartment = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ userId: z.string(), departmentId: z.string().uuid() }),
  )
  .handler(async ({ data }) => {
    await db
      .update(userTable)
      .set({ departmentId: data.departmentId })
      .where(eq(userTable.id, data.userId))
  })
