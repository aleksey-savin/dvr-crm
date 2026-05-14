import { db } from '@/db'
import { company, industry } from '@/db/schema'
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { asc, eq } from 'drizzle-orm'
import * as z from 'zod'

const industrySchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
})

const updateIndustrySchema = industrySchema.extend({
  id: z.string(),
})

export const fetchIndustries = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db.query.industry.findMany({
      orderBy: [asc(industry.name)],
    })
  },
)

export const fetchIndustry = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.industry.findFirst({
      where: eq(industry.id, data.id),
    })

    if (!row) throw notFound()
    return row
  })

export const addIndustry = createServerFn({ method: 'POST' })
  .inputValidator(industrySchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(industry)
      .values({ name: data.name.trim() })
      .returning({ id: industry.id })

    return inserted.id
  })

export const updateIndustry = createServerFn({ method: 'POST' })
  .inputValidator(updateIndustrySchema)
  .handler(async ({ data }) => {
    const name = data.name.trim()

    await db.transaction(async (tx) => {
      await tx.update(industry).set({ name }).where(eq(industry.id, data.id))

      // Keep legacy company.industry text in sync while the codebase still has
      // read fallbacks for older data.
      await tx
        .update(company)
        .set({ industry: name })
        .where(eq(company.industryId, data.id))
    })
  })

export const deleteIndustry = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    await db.transaction(async (tx) => {
      await tx
        .update(company)
        .set({ industryId: null, industry: null })
        .where(eq(company.industryId, id))

      await tx.delete(industry).where(eq(industry.id, id))
    })
  })
