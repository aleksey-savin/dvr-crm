import { db } from '@/db'
import { department, user } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from 'utils/auth'

async function getServerSession() {
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
    .select({ id: department.id, parentId: department.parentId, headUserId: department.headUserId })
    .from(department)

  if (session.user.role === 'admin') {
    return allDepts.map((d) => d.id)
  }

  const headedIds = allDepts
    .filter((d) => d.headUserId === session.user.id)
    .map((d) => d.id)

  if (headedIds.length > 0) {
    return collectDescendants(allDepts, headedIds)
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { departmentId: true },
  })

  return currentUser?.departmentId ? [currentUser.departmentId] : []
}

function collectDescendants(
  allDepts: { id: string; parentId: string | null }[],
  rootIds: string[],
): string[] {
  const result = new Set(rootIds)
  const queue = [...rootIds]
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const d of allDepts) {
      if (d.parentId === current && !result.has(d.id)) {
        result.add(d.id)
        queue.push(d.id)
      }
    }
  }
  return Array.from(result)
}
