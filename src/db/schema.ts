import { relations } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  primaryKey,
  numeric,
  integer,
} from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// Auth — Better Auth managed tables (do not rename columns)
// ---------------------------------------------------------------------------

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  position: text('position'),
  phone: text('phone'),
  role: text('role').notNull().default('user'),
  departmentId: text('department_id').references(
    (): AnyPgColumn => department.id,
    {
      onDelete: 'set null',
    },
  ),
  banned: boolean('banned').default(false).notNull(),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    impersonatedBy: text('impersonated_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

// ---------------------------------------------------------------------------
// Department (semantic: Бизнес-юнит, 1.1.2)
// ---------------------------------------------------------------------------

export const department = pgTable(
  'department',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    description: text('description'),
    accentColor: text('accent_color'),
    headUserId: text('head_user_id').references((): AnyPgColumn => user.id, {
      onDelete: 'restrict',
    }),
    parentId: text('parent_department_id').references(
      (): AnyPgColumn => department.id,
      { onDelete: 'restrict' },
    ),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('department_name_idx').on(table.name),
    index('department_head_user_id_idx').on(table.headUserId),
    index('department_parent_id_idx').on(table.parentId),
  ],
)

// ---------------------------------------------------------------------------
// Company (1.1.1)
// ---------------------------------------------------------------------------

export const company = pgTable('company', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  regionalMarketPosition: text('regional_market_position'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  industry: text('industry'),
})

// ---------------------------------------------------------------------------
// Company Account in Business Unit (1.1.3)
// Replaces the former `client` and `wishlistClient` tables.
// ---------------------------------------------------------------------------

export const companyAccount = pgTable(
  'company_account',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Required relations
    companyId: text('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }),
    businessUnitId: text('business_unit_id')
      .notNull()
      .references(() => department.id, { onDelete: 'cascade' }),

    // Account type: client | wishlist | prospect | lost
    accountType: text('account_type', {
      enum: ['client', 'wishlist', 'prospect', 'lost'],
    })
      .notNull()
      .default('client'),

    // Client classification
    isTarget: boolean('is_target').notNull().default(false),

    // Position in ranked list (primarily for wishlist scenario)
    position: integer('position'),

    // Loss state
    isLost: boolean('is_lost').notNull().default(false),
    lostReasons: text('lost_reasons'),

    // Wishlist-specific state
    wishlistState: text('wishlist_state', {
      enum: ['active', 'basement', 'archived'],
    }),

    // Optional owner / responsible manager
    ownerUserId: text('owner_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),

    // Free-form context fields
    why: text('why'),
    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('company_account_companyId_idx').on(table.companyId),
    index('company_account_businessUnitId_idx').on(table.businessUnitId),
    index('company_account_accountType_idx').on(table.accountType),
    index('company_account_ownerUserId_idx').on(table.ownerUserId),
  ],
)

// ---------------------------------------------------------------------------
// Account Risks (was: clientRisk)
// ---------------------------------------------------------------------------

export const accountRisk = pgTable(
  'account_risks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyAccountId: text('company_account_id')
      .notNull()
      .references(() => companyAccount.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('account_risks_companyAccountId_idx').on(table.companyAccountId),
  ],
)

// ---------------------------------------------------------------------------
// Account Gross Profit per year (was: clientGrossProfit)
// ---------------------------------------------------------------------------

export const accountGrossProfit = pgTable(
  'account_gross_profits',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyAccountId: text('company_account_id')
      .notNull()
      .references(() => companyAccount.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    value: numeric('value').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('account_gross_profits_companyAccountId_idx').on(
      table.companyAccountId,
    ),
    index('account_gross_profits_companyAccountId_year_idx').on(
      table.companyAccountId,
      table.year,
    ),
  ],
)

// ---------------------------------------------------------------------------
// Company Revenue per year (unchanged — attached to company, not account)
// ---------------------------------------------------------------------------

export const companyRevenue = pgTable(
  'company_revenue',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyId: text('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    value: numeric('value').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('company_revenue_companyId_idx').on(table.companyId),
    index('company_revenue_companyId_year_idx').on(table.companyId, table.year),
  ],
)

// ---------------------------------------------------------------------------
// Account Hooks — engagement hooks (was: clientHook on wishlistClient)
// ---------------------------------------------------------------------------

export const accountHook = pgTable(
  'account_hooks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyAccountId: text('company_account_id')
      .notNull()
      .references(() => companyAccount.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('account_hooks_companyAccountId_idx').on(table.companyAccountId),
  ],
)

// ---------------------------------------------------------------------------
// Company Contacts (unchanged — contacts belong to the company)
// ---------------------------------------------------------------------------

export const companyContact = pgTable(
  'company_contact',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyId: text('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    position: text('position'),
    description: text('description'),
    contacts: text('contacts'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('company_contacts_companyId_idx').on(table.companyId)],
)

// ---------------------------------------------------------------------------
// Account Upselling Opportunities (was: clientUpsellingOpportunity)
// ---------------------------------------------------------------------------

export const accountUpsellingOpportunity = pgTable(
  'account_upselling_opportunities',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyAccountId: text('company_account_id')
      .notNull()
      .references(() => companyAccount.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('account_upselling_opportunities_companyAccountId_idx').on(
      table.companyAccountId,
    ),
  ],
)

// ---------------------------------------------------------------------------
// Account Target Forecast per year (was: clientTargetForecast)
// ---------------------------------------------------------------------------

export const accountTargetForecast = pgTable(
  'account_target_forecasts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyAccountId: text('company_account_id')
      .notNull()
      .references(() => companyAccount.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    value: numeric('value').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('account_target_forecasts_companyAccountId_idx').on(
      table.companyAccountId,
    ),
    index('account_target_forecasts_companyAccountId_year_idx').on(
      table.companyAccountId,
      table.year,
    ),
  ],
)

// ---------------------------------------------------------------------------
// Todos
// `companyAccountId` replaces the former `clientId` + `wishlistClientId`
// ---------------------------------------------------------------------------

export const todo = pgTable('todos', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['not started', 'in progress', 'completed'],
  })
    .default('not started')
    .notNull(),
  departmentId: text('department_id')
    .notNull()
    .references(() => department.id, { onDelete: 'cascade' }),
  companyAccountId: text('company_account_id').references(
    () => companyAccount.id,
    { onDelete: 'cascade' },
  ),
  createdBy: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  deadline: timestamp('deadline')
    .notNull()
    .default(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  completedAt: timestamp({ withTimezone: true }),
  archivedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const todoResponsibleUsers = pgTable(
  'todo_responsible_users',
  {
    todoId: text('todo_id')
      .notNull()
      .references(() => todo.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.todoId, table.userId] }),
    index('todo_responsible_users_todoId_idx').on(table.todoId),
    index('todo_responsible_users_userId_idx').on(table.userId),
  ],
)

// ---------------------------------------------------------------------------
// Comments (polymorphic, entity-agnostic)
// `entityType` examples: 'todo' | 'company' | 'companyAccount' | …
// ---------------------------------------------------------------------------

export const comment = pgTable(
  'comments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    content: text('content').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    editedAt: timestamp('edited_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('comments_entity_idx').on(table.entityType, table.entityId),
    index('comments_authorId_idx').on(table.authorId),
  ],
)

export const commentAttachment = pgTable(
  'comment_attachments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    commentId: text('comment_id')
      .notNull()
      .references(() => comment.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    name: text('name').notNull(),
    mimeType: text('mime_type'),
    size: text('size'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('comment_attachments_commentId_idx').on(table.commentId)],
)

export const commentRead = pgTable(
  'comment_reads',
  {
    commentId: text('comment_id')
      .notNull()
      .references(() => comment.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    readAt: timestamp('read_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.commentId, table.userId] }),
    index('comment_reads_commentId_idx').on(table.commentId),
    index('comment_reads_userId_idx').on(table.userId),
  ],
)

// ---------------------------------------------------------------------------
// Meeting (linked to company, not to account)
// ---------------------------------------------------------------------------

export const meeting = pgTable('meeting', {
  id: text('id').notNull().primaryKey(),
  title: text('title').notNull(),
  summary: text('summary'),
  transcription: text('transcription'),
  companyId: text('company_id').references(() => company.id, {
    onDelete: 'cascade',
  }),
})

// ---------------------------------------------------------------------------
// API Key
// ---------------------------------------------------------------------------

export const apiKey = pgTable('api_key', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  key: text('key').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

// ===========================================================================
// Relations
// ===========================================================================

export const commentRelations = relations(comment, ({ one, many }) => ({
  author: one(user, {
    fields: [comment.authorId],
    references: [user.id],
  }),
  attachments: many(commentAttachment),
  reads: many(commentRead),
}))

export const commentAttachmentRelations = relations(
  commentAttachment,
  ({ one }) => ({
    comment: one(comment, {
      fields: [commentAttachment.commentId],
      references: [comment.id],
    }),
  }),
)

export const commentReadRelations = relations(commentRead, ({ one }) => ({
  comment: one(comment, {
    fields: [commentRead.commentId],
    references: [comment.id],
  }),
  user: one(user, {
    fields: [commentRead.userId],
    references: [user.id],
  }),
}))

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  ownedCompanyAccounts: many(companyAccount),
  headedDepartments: many(department, {
    relationName: 'departmentHead',
  }),
  responsibleTodos: many(todoResponsibleUsers),
  comments: many(comment),
  commentReads: many(commentRead),
  apiKeys: many(apiKey),
  department: one(department, {
    fields: [user.departmentId],
    references: [department.id],
    relationName: 'departmentUsers',
  }),
}))

export const companyAccountRelations = relations(
  companyAccount,
  ({ one, many }) => ({
    company: one(company, {
      fields: [companyAccount.companyId],
      references: [company.id],
    }),
    businessUnit: one(department, {
      fields: [companyAccount.businessUnitId],
      references: [department.id],
    }),
    owner: one(user, {
      fields: [companyAccount.ownerUserId],
      references: [user.id],
    }),
    risks: many(accountRisk),
    grossProfits: many(accountGrossProfit),
    targetForecasts: many(accountTargetForecast),
    upsellingOpportunities: many(accountUpsellingOpportunity),
    hooks: many(accountHook),
    todos: many(todo),
  }),
)

export const accountRiskRelations = relations(accountRisk, ({ one }) => ({
  account: one(companyAccount, {
    fields: [accountRisk.companyAccountId],
    references: [companyAccount.id],
  }),
}))

export const accountGrossProfitRelations = relations(
  accountGrossProfit,
  ({ one }) => ({
    account: one(companyAccount, {
      fields: [accountGrossProfit.companyAccountId],
      references: [companyAccount.id],
    }),
  }),
)

export const accountTargetForecastRelations = relations(
  accountTargetForecast,
  ({ one }) => ({
    account: one(companyAccount, {
      fields: [accountTargetForecast.companyAccountId],
      references: [companyAccount.id],
    }),
  }),
)

export const accountUpsellingOpportunityRelations = relations(
  accountUpsellingOpportunity,
  ({ one }) => ({
    account: one(companyAccount, {
      fields: [accountUpsellingOpportunity.companyAccountId],
      references: [companyAccount.id],
    }),
  }),
)

export const accountHookRelations = relations(accountHook, ({ one }) => ({
  account: one(companyAccount, {
    fields: [accountHook.companyAccountId],
    references: [companyAccount.id],
  }),
}))

export const companyRelations = relations(company, ({ many }) => ({
  accounts: many(companyAccount),
  revenues: many(companyRevenue),
  contacts: many(companyContact),
}))

export const companyRevenueRelations = relations(companyRevenue, ({ one }) => ({
  company: one(company, {
    fields: [companyRevenue.companyId],
    references: [company.id],
  }),
}))

export const companyContactRelations = relations(companyContact, ({ one }) => ({
  company: one(company, {
    fields: [companyContact.companyId],
    references: [company.id],
  }),
}))

export const departmentRelations = relations(department, ({ one, many }) => ({
  head: one(user, {
    fields: [department.headUserId],
    references: [user.id],
    relationName: 'departmentHead',
  }),
  parent: one(department, {
    fields: [department.parentId],
    references: [department.id],
    relationName: 'departmentHierarchy',
  }),
  children: many(department, {
    relationName: 'departmentHierarchy',
  }),
  todos: many(todo),
  accounts: many(companyAccount),
  users: many(user, {
    relationName: 'departmentUsers',
  }),
}))

export const meetingRelations = relations(meeting, ({ one }) => ({
  company: one(company, {
    fields: [meeting.companyId],
    references: [company.id],
  }),
}))

export const todoRelations = relations(todo, ({ one, many }) => ({
  creator: one(user, {
    fields: [todo.createdBy],
    references: [user.id],
  }),
  department: one(department, {
    fields: [todo.departmentId],
    references: [department.id],
  }),
  companyAccount: one(companyAccount, {
    fields: [todo.companyAccountId],
    references: [companyAccount.id],
  }),
  responsibleUsers: many(todoResponsibleUsers),
}))

export const todoResponsibleUsersRelations = relations(
  todoResponsibleUsers,
  ({ one }) => ({
    todo: one(todo, {
      fields: [todoResponsibleUsers.todoId],
      references: [todo.id],
    }),
    user: one(user, {
      fields: [todoResponsibleUsers.userId],
      references: [user.id],
    }),
  }),
)

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  user: one(user, {
    fields: [apiKey.userId],
    references: [user.id],
  }),
}))
