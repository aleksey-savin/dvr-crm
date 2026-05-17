import { db } from '@/db'
import { contactRole, companyContact } from '@/db/schema'
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { asc, eq } from 'drizzle-orm'
import * as z from 'zod'

const contactRoleSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
})

const updateContactRoleSchema = contactRoleSchema.extend({
  id: z.string(),
})

export const fetchContactRoles = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db.query.contactRole.findMany({
      orderBy: [asc(contactRole.name)],
    })
  },
)

export const fetchContactRole = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.contactRole.findFirst({
      where: eq(contactRole.id, data.id),
    })

    if (!row) throw notFound()
    return row
  })

export const addContactRole = createServerFn({ method: 'POST' })
  .inputValidator(contactRoleSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(contactRole)
      .values({ name: data.name.trim() })
      .returning({ id: contactRole.id })

    return inserted.id
  })

export const updateContactRole = createServerFn({ method: 'POST' })
  .inputValidator(updateContactRoleSchema)
  .handler(async ({ data }) => {
    await db
      .update(contactRole)
      .set({ name: data.name.trim() })
      .where(eq(contactRole.id, data.id))
  })

export const deleteContactRole = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    await db.transaction(async (tx) => {
      await tx
        .update(companyContact)
        .set({ contactRoleId: null })
        .where(eq(companyContact.contactRoleId, id))

      await tx.delete(contactRole).where(eq(contactRole.id, id))
    })
  })
