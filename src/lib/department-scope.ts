import { db } from '@/db'
import { department, user } from '@/db/schema'
import { eq, inArray, isNull, or } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from 'utils/auth'
import { collectDepartmentDescendants } from '@/lib/department-tree'

export async function getServerSession() {
  const request = getRequest()
  return auth.api.getSession({ headers: request.headers })
}

/**
 * Returns the list of department IDs the current session user can access:
 * - admin → all departments
 * - department head (headUserId) → their department(s) + all descendants
 * - regular user → only their own department
 */
export async function getAccessibleDepartmentIds(): Promise<string[]> {
  const session = await getServerSession()
  if (!session?.user) return []

  const allDepts = await db
    .select({
      id: department.id,
      parentId: department.parentId,
      headUserId: department.headUserId,
    })
    .from(department)

  if (session.user.role === 'admin') {
    return allDepts.map((d) => d.id)
  }

  const headedIds = allDepts
    .filter((d) => d.headUserId === session.user.id)
    .map((d) => d.id)

  if (headedIds.length > 0) {
    return collectDepartmentDescendants(allDepts, headedIds)
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { departmentId: true },
  })

  return currentUser?.departmentId ? [currentUser.departmentId] : []
}

/**
 * Builds a WHERE condition restricting a query to departments the current user
 * may access. Roles in `bypassRoles` (default ['admin']) get no restriction.
 * Records with a null department are always included (visible to everyone).
 */
export async function buildDepartmentScopeFilter(
  departmentColumn: AnyPgColumn,
  opts?: { bypassRoles?: string[] },
): Promise<SQL | undefined> {
  const session = await getServerSession()
  const role = session?.user.role
  const bypass = opts?.bypassRoles ?? ['admin']
  if (role && bypass.includes(role)) return undefined
  const accessibleIds = await getAccessibleDepartmentIds()
  return accessibleIds.length > 0
    ? or(inArray(departmentColumn, accessibleIds), isNull(departmentColumn))
    : isNull(departmentColumn)
}
