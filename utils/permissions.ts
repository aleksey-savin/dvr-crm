import { createAccessControl } from 'better-auth/plugins/access'
import { defaultStatements, adminAc } from 'better-auth/plugins/admin/access'
/**
 * make sure to use `as const` so typescript can infer the type correctly
 */
const statement = {
  ...defaultStatements,
  company: ['create', 'update', 'delete'],
  task: ['create', 'update', 'delete', 'assign', 'unassign'],
} as const

export const ac = createAccessControl(statement)

export const user = ac.newRole({ ...adminAc.statements })

export const admin = ac.newRole({
  ...adminAc.statements,
  company: ['create', 'update', 'delete'],
  task: ['create', 'update', 'delete', 'assign', 'unassign'],
})

export const manager = ac.newRole({
  ...adminAc.statements,
  company: ['create', 'update', 'delete'],
  task: ['create', 'update', 'delete', 'assign', 'unassign'],
})

export const tenderSpecialist = ac.newRole({
  ...adminAc.statements,
  company: ['create', 'update', 'delete'],
  task: ['create', 'update', 'delete', 'assign', 'unassign'],
})
