import { relations } from 'drizzle-orm'
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

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  role: text('role').notNull().default('user'),
  departmentId: text('department_id').references(() => department.id, {
    onDelete: 'set null',
  }),
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
  clientId: text('client_id').references(() => client.id, {
    onDelete: 'cascade',
  }),
  wishlistClientId: text('wishlist_client_id').references(
    () => wishlistClient.id,
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

export const department = pgTable(
  'department',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    description: text('description'),
    accentColor: text('accent_color'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('department_name_idx').on(table.name)],
)

export const company = pgTable('company', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  regionalMarketPosition: text('regional_market_position'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const client = pgTable(
  'client',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    companyId: text('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }),
    departmentId: text('department_id')
      .notNull()
      .references(() => department.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    target: boolean().notNull().default(false),
    lost: boolean().notNull().default(false),
    lostReasons: text('lost_reasons').notNull().default(''),
    why: text('why'),
  },
  (table) => [
    index('client_companyId_idx').on(table.companyId),
    index('client_departmentId_position_idx').on(
      table.departmentId,
      table.position,
    ),
  ],
)

export const wishlistClient = pgTable(
  'wishlist_client',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyId: text('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    why: text('why'),
    industry: text('industry'),
  },
  (table) => [index('wishlist_client_companyId_idx').on(table.companyId)],
)

// ---------------------------------------------------------------------------
// Wishlist Client Departments (many-to-many)
// ---------------------------------------------------------------------------

export const wishlistClientDepartment = pgTable(
  'wishlist_client_department',
  {
    wishlistClientId: text('wishlist_client_id')
      .notNull()
      .references(() => wishlistClient.id, { onDelete: 'cascade' }),
    departmentId: text('department_id')
      .notNull()
      .references(() => department.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.wishlistClientId, table.departmentId] }),
    index('wishlist_client_dept_wishlistClientId_idx').on(
      table.wishlistClientId,
    ),
    index('wishlist_client_dept_departmentId_idx').on(table.departmentId),
  ],
)

// ---------------------------------------------------------------------------
// Wishlist Client Responsible Users (many-to-many)
// ---------------------------------------------------------------------------

export const wishlistClientResponsibleUsers = pgTable(
  'wishlist_client_responsible_users',
  {
    wishlistClientId: text('wishlist_client_id')
      .notNull()
      .references(() => wishlistClient.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.wishlistClientId, table.userId] }),
    index('wishlist_client_responsible_wishlistClientId_idx').on(
      table.wishlistClientId,
    ),
    index('wishlist_client_responsible_userId_idx').on(table.userId),
  ],
)

// ---------------------------------------------------------------------------
// Client Managers (many-to-many)
// ---------------------------------------------------------------------------

export const clientManager = pgTable(
  'client_managers',
  {
    clientId: text('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.clientId, table.userId] }),
    index('client_managers_clientId_idx').on(table.clientId),
    index('client_managers_userId_idx').on(table.userId),
  ],
)

// ---------------------------------------------------------------------------
// Client Risks
// ---------------------------------------------------------------------------

export const clientRisk = pgTable(
  'client_risks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('client_risks_clientId_idx').on(table.clientId)],
)

// ---------------------------------------------------------------------------
// Client Gross Profit (per year)
// ---------------------------------------------------------------------------

export const clientGrossProfit = pgTable(
  'client_gross_profits',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    value: numeric('value').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('client_gross_profits_clientId_idx').on(table.clientId),
    index('client_gross_profits_clientId_year_idx').on(
      table.clientId,
      table.year,
    ),
  ],
)

// ---------------------------------------------------------------------------
// Company Revenue (per company)
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
// Client Hooks (per wishlist client)
// ---------------------------------------------------------------------------

export const clientHook = pgTable(
  'client_hook',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    wishlistClientId: text('wishlist_client_id')
      .notNull()
      .references(() => wishlistClient.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('client_hook_wishlistClientId_idx').on(table.wishlistClientId),
  ],
)

// ---------------------------------------------------------------------------
// Company Contacts
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
// Client Upselling Opportunities
// ---------------------------------------------------------------------------

export const clientUpsellingOpportunity = pgTable(
  'client_upselling_opportunities',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('client_upselling_opportunities_clientId_idx').on(table.clientId),
  ],
)

// ---------------------------------------------------------------------------
// Client Target Forecast (per year)
// ---------------------------------------------------------------------------

export const clientTargetForecast = pgTable(
  'client_target_forecasts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    value: numeric('value').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('client_target_forecasts_clientId_idx').on(table.clientId),
    index('client_target_forecasts_clientId_year_idx').on(
      table.clientId,
      table.year,
    ),
  ],
)

// ---------------------------------------------------------------------------
// Comments (entity-agnostic / polymorphic)
// ---------------------------------------------------------------------------
// `entityType` holds a string key that identifies the target table, e.g.
//   'todo' | 'user' | 'company' | …
// `entityId`   holds the primary-key value of the target row.
// No database-level foreign key is declared so the table stays generic.
// ---------------------------------------------------------------------------

export const comment = pgTable(
  'comments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    content: text('content').notNull(),
    /** Identifies which table/entity this comment belongs to, e.g. 'todo', 'user', 'company' */
    entityType: text('entity_type').notNull(),
    /** Primary-key value of the target row */
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
    // Fast lookup of all comments for a given entity
    index('comments_entity_idx').on(table.entityType, table.entityId),
    index('comments_authorId_idx').on(table.authorId),
  ],
)

// ---------------------------------------------------------------------------
// Comment Attachments
// ---------------------------------------------------------------------------

export const commentAttachment = pgTable(
  'comment_attachments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    commentId: text('comment_id')
      .notNull()
      .references(() => comment.id, { onDelete: 'cascade' }),
    /** Public or pre-signed URL of the uploaded file */
    url: text('url').notNull(),
    /** Original filename, e.g. "report.pdf" */
    name: text('name').notNull(),
    /** MIME type, e.g. "application/pdf", "image/png" */
    mimeType: text('mime_type'),
    /** File size in bytes */
    size: text('size'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('comment_attachments_commentId_idx').on(table.commentId)],
)

// ---------------------------------------------------------------------------
// Comment Reads (read/unread tracking per user)
// ---------------------------------------------------------------------------
// A row exists when a user has read a comment.
// Absence of a row means the comment is unread for that user.
// ---------------------------------------------------------------------------

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

export const meeting = pgTable('meeting', {
  id: text('id').notNull().primaryKey(),
  title: text('title').notNull(),
  summary: text('summary'),
  transcription: text('transcription'),
  companyId: text('company_id').references(() => company.id, {
    onDelete: 'cascade',
  }),
})

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

// ---------------------------------------------------------------------------

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
  managedClients: many(clientManager),
  responsibleTodos: many(todoResponsibleUsers),
  responsibleWishlistClients: many(wishlistClientResponsibleUsers),
  comments: many(comment),
  commentReads: many(commentRead),
  apiKeys: many(apiKey),
  department: one(department, {
    fields: [user.departmentId],
    references: [department.id],
  }),
}))

export const clientRelations = relations(client, ({ one, many }) => ({
  company: one(company, {
    fields: [client.companyId],
    references: [company.id],
  }),
  department: one(department, {
    fields: [client.departmentId],
    references: [department.id],
  }),
  managers: many(clientManager),
  risks: many(clientRisk),
  grossProfits: many(clientGrossProfit),
  targetForecasts: many(clientTargetForecast),
  upsellingOpportunities: many(clientUpsellingOpportunity),
  meetings: many(meeting),
}))

export const wishlistClientRelations = relations(
  wishlistClient,
  ({ one, many }) => ({
    company: one(company, {
      fields: [wishlistClient.companyId],
      references: [company.id],
    }),
    departments: many(wishlistClientDepartment),
    hooks: many(clientHook),
    todos: many(todo),
    responsibleUsers: many(wishlistClientResponsibleUsers),
  }),
)

export const wishlistClientResponsibleUsersRelations = relations(
  wishlistClientResponsibleUsers,
  ({ one }) => ({
    wishlistClient: one(wishlistClient, {
      fields: [wishlistClientResponsibleUsers.wishlistClientId],
      references: [wishlistClient.id],
    }),
    user: one(user, {
      fields: [wishlistClientResponsibleUsers.userId],
      references: [user.id],
    }),
  }),
)

export const wishlistClientDepartmentRelations = relations(
  wishlistClientDepartment,
  ({ one }) => ({
    wishlistClient: one(wishlistClient, {
      fields: [wishlistClientDepartment.wishlistClientId],
      references: [wishlistClient.id],
    }),
    department: one(department, {
      fields: [wishlistClientDepartment.departmentId],
      references: [department.id],
    }),
  }),
)

export const clientManagerRelations = relations(clientManager, ({ one }) => ({
  client: one(client, {
    fields: [clientManager.clientId],
    references: [client.id],
  }),
  user: one(user, {
    fields: [clientManager.userId],
    references: [user.id],
  }),
}))

export const clientRiskRelations = relations(clientRisk, ({ one }) => ({
  client: one(client, {
    fields: [clientRisk.clientId],
    references: [client.id],
  }),
}))

export const clientGrossProfitRelations = relations(
  clientGrossProfit,
  ({ one }) => ({
    client: one(client, {
      fields: [clientGrossProfit.clientId],
      references: [client.id],
    }),
  }),
)

export const clientTargetForecastRelations = relations(
  clientTargetForecast,
  ({ one }) => ({
    client: one(client, {
      fields: [clientTargetForecast.clientId],
      references: [client.id],
    }),
  }),
)

export const clientUpsellingOpportunityRelations = relations(
  clientUpsellingOpportunity,
  ({ one }) => ({
    client: one(client, {
      fields: [clientUpsellingOpportunity.clientId],
      references: [client.id],
    }),
  }),
)

export const companyRelations = relations(company, ({ many }) => ({
  clients: many(client),
  wishlistClients: many(wishlistClient),
  revenues: many(companyRevenue),
  contacts: many(companyContact),
}))

export const companyRevenueRelations = relations(companyRevenue, ({ one }) => ({
  company: one(company, {
    fields: [companyRevenue.companyId],
    references: [company.id],
  }),
}))

export const clientHookRelations = relations(clientHook, ({ one }) => ({
  wishlistClient: one(wishlistClient, {
    fields: [clientHook.wishlistClientId],
    references: [wishlistClient.id],
  }),
}))

export const companyContactRelations = relations(companyContact, ({ one }) => ({
  company: one(company, {
    fields: [companyContact.companyId],
    references: [company.id],
  }),
}))

export const departmentRelations = relations(department, ({ many }) => ({
  todos: many(todo),
  clients: many(client),
  wishlistClients: many(wishlistClientDepartment),
  users: many(user),
}))

export const meetingRelations = relations(meeting, ({ many }) => ({
  clients: many(client),
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
  client: one(client, {
    fields: [todo.clientId],
    references: [client.id],
  }),
  wishlistClient: one(wishlistClient, {
    fields: [todo.wishlistClientId],
    references: [wishlistClient.id],
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
