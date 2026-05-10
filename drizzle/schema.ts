import {
  pgTable,
  foreignKey,
  text,
  index,
  timestamp,
  unique,
  boolean,
  integer,
  numeric,
  primaryKey,
} from 'drizzle-orm/pg-core'

export const meeting = pgTable(
  'meeting',
  {
    id: text().primaryKey().notNull(),
    title: text().notNull(),
    summary: text(),
    transcription: text(),
    companyId: text('company_id'),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [company.id],
      name: 'meeting_company_id_company_id_fk',
    }).onDelete('cascade'),
  ],
)

export const verification = pgTable(
  'verification',
  {
    id: text().primaryKey().notNull(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('verification_identifier_idx').using(
      'btree',
      table.identifier.asc().nullsLast().op('text_ops'),
    ),
  ],
)

export const account = pgTable(
  'account',
  {
    id: text().primaryKey().notNull(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      mode: 'string',
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      mode: 'string',
    }),
    scope: text(),
    password: text(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
  },
  (table) => [
    index('account_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'account_user_id_user_id_fk',
    }).onDelete('cascade'),
  ],
)

export const company = pgTable('company', {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  description: text(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  regionalMarketPosition: text('regional_market_position'),
  industry: text(),
})

export const session = pgTable(
  'session',
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
    token: text().notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull(),
    impersonatedBy: text('impersonated_by'),
  },
  (table) => [
    index('session_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'session_user_id_user_id_fk',
    }).onDelete('cascade'),
    unique('session_token_unique').on(table.token),
  ],
)

export const comments = pgTable(
  'comments',
  {
    id: text().primaryKey().notNull(),
    content: text().notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    authorId: text('author_id').notNull(),
    editedAt: timestamp('edited_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('comments_authorId_idx').using(
      'btree',
      table.authorId.asc().nullsLast().op('text_ops'),
    ),
    index('comments_entity_idx').using(
      'btree',
      table.entityType.asc().nullsLast().op('text_ops'),
      table.entityId.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [user.id],
      name: 'comments_author_id_user_id_fk',
    }).onDelete('cascade'),
  ],
)

export const user = pgTable(
  'user',
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    role: text().default('user').notNull(),
    banned: boolean().default(false).notNull(),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires', { mode: 'string' }),
    departmentId: text('department_id'),
  },
  (table) => [
    foreignKey({
      columns: [table.departmentId],
      foreignColumns: [department.id],
      name: 'user_department_id_department_id_fk',
    }).onDelete('set null'),
    unique('user_email_unique').on(table.email),
  ],
)

export const department = pgTable(
  'department',
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    description: text(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    accentColor: text('accent_color'),
  },
  (table) => [
    index('department_name_idx').using(
      'btree',
      table.name.asc().nullsLast().op('text_ops'),
    ),
  ],
)

export const todos = pgTable(
  'todos',
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    completedAt: timestamp({ withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    description: text(),
    userId: text('user_id').notNull(),
    deadline: timestamp({ mode: 'string' })
      .default('2026-03-29 05:46:38.824')
      .notNull(),
    status: text().default('not started').notNull(),
    archivedAt: timestamp({ withTimezone: true, mode: 'string' }),
    departmentId: text('department_id').notNull(),
    companyAccountId: text('company_account_id'),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'todos_user_id_user_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.departmentId],
      foreignColumns: [department.id],
      name: 'todos_department_id_department_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.companyAccountId],
      foreignColumns: [companyAccount.id],
      name: 'todos_company_account_id_company_account_id_fk',
    }).onDelete('cascade'),
  ],
)

export const apiKey = pgTable(
  'api_key',
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    key: text().notNull(),
    userId: text('user_id').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'api_key_user_id_user_id_fk',
    }).onDelete('cascade'),
  ],
)

export const commentAttachments = pgTable(
  'comment_attachments',
  {
    id: text().primaryKey().notNull(),
    commentId: text('comment_id').notNull(),
    url: text().notNull(),
    name: text().notNull(),
    mimeType: text('mime_type'),
    size: text(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('comment_attachments_commentId_idx').using(
      'btree',
      table.commentId.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.commentId],
      foreignColumns: [comments.id],
      name: 'comment_attachments_comment_id_comments_id_fk',
    }).onDelete('cascade'),
  ],
)

export const accountHooks = pgTable(
  'account_hooks',
  {
    id: text().primaryKey().notNull(),
    companyAccountId: text('company_account_id').notNull(),
    description: text().notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('account_hooks_companyAccountId_idx').using(
      'btree',
      table.companyAccountId.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.companyAccountId],
      foreignColumns: [companyAccount.id],
      name: 'account_hooks_company_account_id_company_account_id_fk',
    }).onDelete('cascade'),
  ],
)

export const accountRisks = pgTable(
  'account_risks',
  {
    id: text().primaryKey().notNull(),
    companyAccountId: text('company_account_id').notNull(),
    description: text().notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('account_risks_companyAccountId_idx').using(
      'btree',
      table.companyAccountId.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.companyAccountId],
      foreignColumns: [companyAccount.id],
      name: 'account_risks_company_account_id_company_account_id_fk',
    }).onDelete('cascade'),
  ],
)

export const companyContact = pgTable(
  'company_contact',
  {
    id: text().primaryKey().notNull(),
    companyId: text('company_id').notNull(),
    name: text().notNull(),
    position: text(),
    description: text(),
    contacts: text(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('company_contacts_companyId_idx').using(
      'btree',
      table.companyId.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [company.id],
      name: 'company_contact_company_id_company_id_fk',
    }).onDelete('cascade'),
  ],
)

export const accountTargetForecasts = pgTable(
  'account_target_forecasts',
  {
    id: text().primaryKey().notNull(),
    companyAccountId: text('company_account_id').notNull(),
    year: integer().notNull(),
    value: numeric().notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('account_target_forecasts_companyAccountId_idx').using(
      'btree',
      table.companyAccountId.asc().nullsLast().op('text_ops'),
    ),
    index('account_target_forecasts_companyAccountId_year_idx').using(
      'btree',
      table.companyAccountId.asc().nullsLast().op('int4_ops'),
      table.year.asc().nullsLast().op('int4_ops'),
    ),
    foreignKey({
      columns: [table.companyAccountId],
      foreignColumns: [companyAccount.id],
      name: 'account_target_forecasts_company_account_id_company_account_id_',
    }).onDelete('cascade'),
  ],
)

export const accountUpsellingOpportunities = pgTable(
  'account_upselling_opportunities',
  {
    id: text().primaryKey().notNull(),
    companyAccountId: text('company_account_id').notNull(),
    description: text().notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('account_upselling_opportunities_companyAccountId_idx').using(
      'btree',
      table.companyAccountId.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.companyAccountId],
      foreignColumns: [companyAccount.id],
      name: 'account_upselling_opportunities_company_account_id_company_acco',
    }).onDelete('cascade'),
  ],
)

export const companyRevenue = pgTable(
  'company_revenue',
  {
    id: text().primaryKey().notNull(),
    year: integer().notNull(),
    value: numeric().notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    companyId: text('company_id').notNull(),
  },
  (table) => [
    index('company_revenue_companyId_idx').using(
      'btree',
      table.companyId.asc().nullsLast().op('text_ops'),
    ),
    index('company_revenue_companyId_year_idx').using(
      'btree',
      table.companyId.asc().nullsLast().op('int4_ops'),
      table.year.asc().nullsLast().op('int4_ops'),
    ),
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [company.id],
      name: 'company_revenue_company_id_company_id_fk',
    }).onDelete('cascade'),
  ],
)

export const companyAccount = pgTable(
  'company_account',
  {
    id: text().primaryKey().notNull(),
    companyId: text('company_id').notNull(),
    businessUnitId: text('business_unit_id').notNull(),
    accountType: text('account_type').default('client').notNull(),
    isTarget: boolean('is_target').default(false).notNull(),
    position: integer(),
    isLost: boolean('is_lost').default(false).notNull(),
    lostReasons: text('lost_reasons'),
    wishlistState: text('wishlist_state'),
    ownerUserId: text('owner_user_id'),
    why: text(),
    notes: text(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('company_account_accountType_idx').using(
      'btree',
      table.accountType.asc().nullsLast().op('text_ops'),
    ),
    index('company_account_businessUnitId_idx').using(
      'btree',
      table.businessUnitId.asc().nullsLast().op('text_ops'),
    ),
    index('company_account_companyId_idx').using(
      'btree',
      table.companyId.asc().nullsLast().op('text_ops'),
    ),
    index('company_account_ownerUserId_idx').using(
      'btree',
      table.ownerUserId.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [company.id],
      name: 'company_account_company_id_company_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.businessUnitId],
      foreignColumns: [department.id],
      name: 'company_account_business_unit_id_department_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.ownerUserId],
      foreignColumns: [user.id],
      name: 'company_account_owner_user_id_user_id_fk',
    }).onDelete('set null'),
  ],
)

export const accountGrossProfits = pgTable(
  'account_gross_profits',
  {
    id: text().primaryKey().notNull(),
    companyAccountId: text('company_account_id').notNull(),
    year: integer().notNull(),
    value: numeric().notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('account_gross_profits_companyAccountId_idx').using(
      'btree',
      table.companyAccountId.asc().nullsLast().op('text_ops'),
    ),
    index('account_gross_profits_companyAccountId_year_idx').using(
      'btree',
      table.companyAccountId.asc().nullsLast().op('int4_ops'),
      table.year.asc().nullsLast().op('int4_ops'),
    ),
    foreignKey({
      columns: [table.companyAccountId],
      foreignColumns: [companyAccount.id],
      name: 'account_gross_profits_company_account_id_company_account_id_fk',
    }).onDelete('cascade'),
  ],
)

export const todoResponsibleUsers = pgTable(
  'todo_responsible_users',
  {
    todoId: text('todo_id').notNull(),
    userId: text('user_id').notNull(),
    assignedAt: timestamp('assigned_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('todo_responsible_users_todoId_idx').using(
      'btree',
      table.todoId.asc().nullsLast().op('text_ops'),
    ),
    index('todo_responsible_users_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.todoId],
      foreignColumns: [todos.id],
      name: 'todo_responsible_users_todo_id_todos_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'todo_responsible_users_user_id_user_id_fk',
    }).onDelete('cascade'),
    primaryKey({
      columns: [table.userId, table.todoId],
      name: 'todo_responsible_users_todo_id_user_id_pk',
    }),
  ],
)

export const commentReads = pgTable(
  'comment_reads',
  {
    commentId: text('comment_id').notNull(),
    userId: text('user_id').notNull(),
    readAt: timestamp('read_at', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index('comment_reads_commentId_idx').using(
      'btree',
      table.commentId.asc().nullsLast().op('text_ops'),
    ),
    index('comment_reads_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.commentId],
      foreignColumns: [comments.id],
      name: 'comment_reads_comment_id_comments_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'comment_reads_user_id_user_id_fk',
    }).onDelete('cascade'),
    primaryKey({
      columns: [table.userId, table.commentId],
      name: 'comment_reads_comment_id_user_id_pk',
    }),
  ],
)
