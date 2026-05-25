import { db } from '@/db'
import { company, department, user, industry } from '@/db/schema'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import * as z from 'zod'

export const fetchCompanies = createServerFn({ method: 'GET' }).handler(
  async () =>
    db
      .select({ id: company.id, name: company.name })
      .from(company)
      .orderBy(company.name),
)

export const fetchDepartments = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ salesOnly: z.boolean().optional() }).optional())
  .handler(async ({ data }) =>
    data?.salesOnly
      ? db
          .select({ id: department.id, name: department.name })
          .from(department)
          .where(eq(department.departmentType, 'sales'))
          .orderBy(department.name)
      : db
          .select({ id: department.id, name: department.name })
          .from(department)
          .orderBy(department.name),
  )

export const fetchUsers = createServerFn({ method: 'GET' }).handler(async () =>
  db
    .select({ id: user.id, name: user.name, departmentId: user.departmentId })
    .from(user)
    .orderBy(user.name),
)

export const fetchIndustries = createServerFn({ method: 'GET' }).handler(
  async () =>
    db
      .select({ id: industry.id, name: industry.name })
      .from(industry)
      .orderBy(industry.name),
)
