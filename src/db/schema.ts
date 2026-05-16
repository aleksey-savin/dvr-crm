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
  unique,
  smallint,
  date,
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
    departmentType: text('department_type')
      .$type<'sales' | 'production' | 'administrative'>()
      .notNull()
      .default('sales'),
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
// Industry
// ---------------------------------------------------------------------------

export const industry = pgTable(
  'industry',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [unique('industry_name_unique').on(table.name)],
)

// ---------------------------------------------------------------------------
// Classifiers (справочники)
// ---------------------------------------------------------------------------

export const contactRole = pgTable(
  'contact_role',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [unique('contact_role_name_unique').on(t.name)],
)

export const signalTypeTable = pgTable(
  'signal_type',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [unique('signal_type_name_unique').on(t.name)],
)

export const source = pgTable(
  'source',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [unique('source_name_unique').on(t.name)],
)

export const refusalReason = pgTable(
  'refusal_reason',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [unique('refusal_reason_name_unique').on(t.name)],
)

export const tag = pgTable(
  'tag',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [unique('tag_name_unique').on(t.name)],
)

// ---------------------------------------------------------------------------
// Company (1.1.1)
// ---------------------------------------------------------------------------

export const company = pgTable('company', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  scope: text('company_scope').$type<'federal' | 'regional'>(),
  website: text('website'),
  description: text('description'),
  regionalMarketPosition: text('regional_market_position'),
  industryId: text('industry_id').references(() => industry.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  // Legacy text fallback. New writes should use industryId.
  industry: text('industry'),
})

// ---------------------------------------------------------------------------
// Counterparty (attached to companies through a junction table)
// ---------------------------------------------------------------------------

export const counterparty = pgTable('counterparty', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  fullName: text('full_name'),
  tin: text('tin'),
  bankAccount: text('bank_account'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const companyCounterparty = pgTable(
  'company_counterparty',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyId: text('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }),
    counterpartyId: text('counterparty_id')
      .notNull()
      .references(() => counterparty.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    unique('company_counterparty_unique').on(
      table.companyId,
      table.counterpartyId,
    ),
    index('company_counterparty_companyId_idx').on(table.companyId),
    index('company_counterparty_counterpartyId_idx').on(table.counterpartyId),
  ],
)

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
    wishlistOffer: text('wishlist_offer'),
    contactNotes: text('contact_notes'),
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

export const companyAccountManagers = pgTable(
  'company_account_managers',
  {
    companyAccountId: text('company_account_id')
      .notNull()
      .references(() => companyAccount.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.companyAccountId, table.userId] }),
    index('company_account_managers_companyAccountId_idx').on(
      table.companyAccountId,
    ),
    index('company_account_managers_userId_idx').on(table.userId),
  ],
)

export const companyAccountDepartments = pgTable(
  'company_account_departments',
  {
    companyAccountId: text('company_account_id')
      .notNull()
      .references(() => companyAccount.id, { onDelete: 'cascade' }),
    departmentId: text('department_id')
      .notNull()
      .references(() => department.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.companyAccountId, table.departmentId] }),
    index('company_account_departments_companyAccountId_idx').on(
      table.companyAccountId,
    ),
    index('company_account_departments_departmentId_idx').on(
      table.departmentId,
    ),
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
// Gross Profit Fact (факт валовой прибыли)
// ---------------------------------------------------------------------------

export const grossProfitFact = pgTable(
  'gross_profit_fact',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyAccountId: text('company_account_id')
      .notNull()
      .references(() => companyAccount.id, { onDelete: 'restrict' }),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    factDate: date('fact_date').notNull(),
    description: text('description'),
    managerUserId: text('manager_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    departmentId: text('department_id')
      .notNull()
      .references(() => department.id, { onDelete: 'restrict' }),
    source: text('source', { enum: ['manual', 'one_c'] })
      .notNull()
      .default('manual'),
    externalSource: text('external_source'),
    externalId: text('external_id'),
    matchedAt: timestamp('matched_at'),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('gross_profit_fact_company_account_id_idx').on(
      table.companyAccountId,
    ),
    index('gross_profit_fact_fact_date_idx').on(table.factDate),
    index('gross_profit_fact_manager_user_id_idx').on(table.managerUserId),
    index('gross_profit_fact_department_id_idx').on(table.departmentId),
    index('gross_profit_fact_source_external_id_idx').on(
      table.externalSource,
      table.externalId,
    ),
    index('gross_profit_fact_deleted_at_idx').on(table.deletedAt),
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
    contactRoleId: text('contact_role_id').references(() => contactRole.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    position: text('position'),
    description: text('description'),
    contacts: text('contacts'),
    phone: text('phone'),
    email: text('email'),
    telegram: text('telegram'),
    max: text('max'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('company_contacts_companyId_idx').on(table.companyId),
    index('company_contacts_contactRoleId_idx').on(table.contactRoleId),
  ],
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
  deadline: timestamp('deadline').notNull().defaultNow(),
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
// Meeting
// ---------------------------------------------------------------------------

export const meeting = pgTable(
  'meeting',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text('title').notNull(),
    summary: text('summary'),
    transcription: text('transcription'),
    companyId: text('company_id').references(() => company.id, {
      onDelete: 'set null',
    }),
    scheduledAt: timestamp('scheduled_at').notNull().defaultNow(),
    endedAt: timestamp('ended_at'),
    status: text('status', {
      enum: ['scheduled', 'completed', 'cancelled'],
    })
      .notNull()
      .default('scheduled'),
    meetingType: text('meeting_type', { enum: ['client', 'internal'] })
      .notNull()
      .default('client'),
    organizerId: text('organizer_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    departmentId: text('department_id').references(() => department.id, {
      onDelete: 'set null',
    }),
    accountId: text('account_id').references(() => companyAccount.id, {
      onDelete: 'set null',
    }),
    leadId: text('lead_id').references(() => lead.id, {
      onDelete: 'set null',
    }),
    tenderId: text('tender_id').references(() => tender.id, {
      onDelete: 'set null',
    }),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('meeting_organizer_id_idx').on(table.organizerId),
    index('meeting_department_id_idx').on(table.departmentId),
    index('meeting_status_idx').on(table.status),
    index('meeting_scheduled_at_idx').on(table.scheduledAt),
    index('meeting_deleted_at_idx').on(table.deletedAt),
  ],
)

export const meetingParticipant = pgTable(
  'meeting_participant',
  {
    meetingId: text('meeting_id')
      .notNull()
      .references(() => meeting.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.meetingId, table.userId] }),
    index('meeting_participant_meeting_id_idx').on(table.meetingId),
    index('meeting_participant_user_id_idx').on(table.userId),
  ],
)

export const meetingExternalParticipant = pgTable(
  'meeting_external_participant',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    meetingId: text('meeting_id')
      .notNull()
      .references(() => meeting.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    contactId: text('contact_id').references(() => companyContact.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('meeting_external_participant_meeting_id_idx').on(table.meetingId),
  ],
)

// ---------------------------------------------------------------------------
// Target Action Type (справочник типов целевых действий)
// ---------------------------------------------------------------------------

export const targetActionType = pgTable(
  'target_action_type',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    isSystem: boolean('is_system').notNull().default(false),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique('target_action_type_slug_unique').on(table.slug),
    index('target_action_type_deleted_at_idx').on(table.deletedAt),
  ],
)

// ---------------------------------------------------------------------------
// Target Action (целевое действие — KPI-событие)
// ---------------------------------------------------------------------------

export const targetAction = pgTable(
  'target_action',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    typeId: text('type_id')
      .notNull()
      .references(() => targetActionType.id, { onDelete: 'restrict' }),
    responsibleUserId: text('responsible_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    departmentId: text('department_id').references(() => department.id, {
      onDelete: 'set null',
    }),
    plannedAt: date('planned_at').notNull(),
    completedAt: timestamp('completed_at'),
    status: text('status', {
      enum: ['planned', 'completed', 'cancelled'],
    })
      .notNull()
      .default('planned'),
    result: text('result'),
    sourceType: text('source_type', {
      enum: ['meeting', 'initiative', 'tender', 'lead', 'signal', 'manual'],
    }).notNull(),
    sourceId: text('source_id'),
    accountId: text('account_id').references(() => companyAccount.id, {
      onDelete: 'set null',
    }),
    leadId: text('lead_id').references(() => lead.id, {
      onDelete: 'set null',
    }),
    tenderId: text('tender_id').references(() => tender.id, {
      onDelete: 'set null',
    }),
    signalId: text('signal_id').references(() => signal.id, {
      onDelete: 'set null',
    }),
    initiativeId: text('initiative_id'),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('target_action_type_id_idx').on(table.typeId),
    index('target_action_responsible_user_id_idx').on(table.responsibleUserId),
    index('target_action_department_id_idx').on(table.departmentId),
    index('target_action_status_idx').on(table.status),
    index('target_action_planned_at_idx').on(table.plannedAt),
    index('target_action_deleted_at_idx').on(table.deletedAt),
    index('target_action_source_idx').on(table.sourceType, table.sourceId),
  ],
)

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

// ---------------------------------------------------------------------------
// Client classification settings
// ---------------------------------------------------------------------------

export const clientClassificationSettings = pgTable(
  'client_classification_settings',
  {
    id: text('id').primaryKey().default('default'),
    targetGrossProfitThreshold: numeric('target_gross_profit_threshold')
      .notNull()
      .default('0'),
    lostActivityYears: integer('lost_activity_years').notNull().default(1),
    updatedByUserId: text('updated_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
)

// ---------------------------------------------------------------------------
// Changelog
// ---------------------------------------------------------------------------

export const changelogRelease = pgTable(
  'changelog_release',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    version: text('version').notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    content: text('content').notNull(),
    status: text('status', {
      enum: ['draft', 'published'],
    })
      .default('draft')
      .notNull(),
    authorId: text('author_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('changelog_release_status_published_at_idx').on(
      table.status,
      table.publishedAt,
    ),
    index('changelog_release_version_idx').on(table.version),
    index('changelog_release_author_id_idx').on(table.authorId),
  ],
)

// ---------------------------------------------------------------------------
// Lead (входящая коммерческая возможность)
// ---------------------------------------------------------------------------

export const lead = pgTable(
  'lead',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text('title').notNull(),
    companyId: text('company_id').references(() => company.id, {
      onDelete: 'set null',
    }),
    departmentId: text('department_id').references(() => department.id, {
      onDelete: 'set null',
    }),
    responsibleUserId: text('responsible_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    industryId: text('industry_id').references(() => industry.id, {
      onDelete: 'set null',
    }),
    sourceId: text('source_id').references(() => source.id, {
      onDelete: 'set null',
    }),
    status: text('status', {
      enum: ['new', 'in_progress', 'converted', 'rejected'],
    })
      .notNull()
      .default('new'),
    budget: numeric('budget', { precision: 15, scale: 2 }),
    description: text('description'),
    dueDate: date('due_date'),
    lostReasonId: text('lost_reason_id').references(() => refusalReason.id, {
      onDelete: 'set null',
    }),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('lead_company_id_idx').on(table.companyId),
    index('lead_department_id_idx').on(table.departmentId),
    index('lead_responsible_user_id_idx').on(table.responsibleUserId),
    index('lead_industry_id_idx').on(table.industryId),
    index('lead_source_id_idx').on(table.sourceId),
    index('lead_lost_reason_id_idx').on(table.lostReasonId),
    index('lead_status_idx').on(table.status),
    index('lead_deleted_at_idx').on(table.deletedAt),
  ],
)

// ---------------------------------------------------------------------------
// Tender (тендерная возможность)
// ---------------------------------------------------------------------------

export const tender = pgTable(
  'tender',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text('title').notNull(),
    companyId: text('company_id').references(() => company.id, {
      onDelete: 'set null',
    }),
    departmentId: text('department_id').references(() => department.id, {
      onDelete: 'set null',
    }),
    responsibleUserId: text('responsible_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    approverUserId: text('approver_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    industryId: text('industry_id').references(() => industry.id, {
      onDelete: 'set null',
    }),
    status: text('status', {
      enum: [
        'new',
        'evaluation',
        'approval',
        'preparation',
        'submitted',
        'won',
        'lost',
        'rejected',
        'archived',
      ],
    })
      .notNull()
      .default('new'),
    amount: numeric('amount', { precision: 15, scale: 2 }),
    description: text('description'),
    deadline: date('deadline'),
    platform: text('platform'),
    url: text('url'),
    lostReasonId: text('lost_reason_id').references(() => refusalReason.id, {
      onDelete: 'set null',
    }),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('tender_company_id_idx').on(table.companyId),
    index('tender_department_id_idx').on(table.departmentId),
    index('tender_responsible_user_id_idx').on(table.responsibleUserId),
    index('tender_approver_user_id_idx').on(table.approverUserId),
    index('tender_industry_id_idx').on(table.industryId),
    index('tender_lost_reason_id_idx').on(table.lostReasonId),
    index('tender_status_idx').on(table.status),
    index('tender_deleted_at_idx').on(table.deletedAt),
  ],
)

// ---------------------------------------------------------------------------
// Signal (сигнал — повод для коммерческой проработки)
// ---------------------------------------------------------------------------

export const signal = pgTable(
  'signal',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text('title').notNull(),
    companyId: text('company_id').references(() => company.id, {
      onDelete: 'set null',
    }),
    departmentId: text('department_id').references(() => department.id, {
      onDelete: 'set null',
    }),
    responsibleUserId: text('responsible_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    industryId: text('industry_id').references(() => industry.id, {
      onDelete: 'set null',
    }),
    signalTypeId: text('signal_type_id').references(() => signalTypeTable.id, {
      onDelete: 'set null',
    }),
    status: text('status', {
      enum: ['new', 'in_progress', 'converted', 'archived'],
    })
      .notNull()
      .default('new'),
    rating: smallint('rating'),
    description: text('description'),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('signal_company_id_idx').on(table.companyId),
    index('signal_department_id_idx').on(table.departmentId),
    index('signal_responsible_user_id_idx').on(table.responsibleUserId),
    index('signal_industry_id_idx').on(table.industryId),
    index('signal_signal_type_id_idx').on(table.signalTypeId),
    index('signal_status_idx').on(table.status),
    index('signal_deleted_at_idx').on(table.deletedAt),
  ],
)

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
  managedCompanyAccounts: many(companyAccountManagers),
  grossProfitFacts: many(grossProfitFact, {
    relationName: 'grossProfitFactManager',
  }),
  headedDepartments: many(department, {
    relationName: 'departmentHead',
  }),
  responsibleTodos: many(todoResponsibleUsers),
  comments: many(comment),
  commentReads: many(commentRead),
  apiKeys: many(apiKey),
  changelogReleases: many(changelogRelease),
  responsibleLeads: many(lead, { relationName: 'leadResponsible' }),
  responsibleTenders: many(tender, { relationName: 'tenderResponsible' }),
  approverTenders: many(tender, { relationName: 'tenderApprover' }),
  responsibleSignals: many(signal, { relationName: 'signalResponsible' }),
  organizedMeetings: many(meeting, { relationName: 'meetingOrganizer' }),
  meetingParticipations: many(meetingParticipant),
  responsibleTargetActions: many(targetAction, {
    relationName: 'targetActionResponsible',
  }),
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
    managers: many(companyAccountManagers),
    departments: many(companyAccountDepartments),
    risks: many(accountRisk),
    grossProfits: many(accountGrossProfit),
    targetForecasts: many(accountTargetForecast),
    upsellingOpportunities: many(accountUpsellingOpportunity),
    hooks: many(accountHook),
    grossProfitFacts: many(grossProfitFact),
    todos: many(todo),
  }),
)

export const companyAccountManagersRelations = relations(
  companyAccountManagers,
  ({ one }) => ({
    account: one(companyAccount, {
      fields: [companyAccountManagers.companyAccountId],
      references: [companyAccount.id],
    }),
    user: one(user, {
      fields: [companyAccountManagers.userId],
      references: [user.id],
    }),
  }),
)

export const companyAccountDepartmentsRelations = relations(
  companyAccountDepartments,
  ({ one }) => ({
    account: one(companyAccount, {
      fields: [companyAccountDepartments.companyAccountId],
      references: [companyAccount.id],
    }),
    department: one(department, {
      fields: [companyAccountDepartments.departmentId],
      references: [department.id],
    }),
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

export const industryRelations = relations(industry, ({ many }) => ({
  companies: many(company),
  leads: many(lead),
  tenders: many(tender),
  signals: many(signal),
}))

export const companyRelations = relations(company, ({ one, many }) => ({
  industryRef: one(industry, {
    fields: [company.industryId],
    references: [industry.id],
  }),
  accounts: many(companyAccount),
  revenues: many(companyRevenue),
  contacts: many(companyContact),
  counterparties: many(companyCounterparty),
  leads: many(lead),
  tenders: many(tender),
  signals: many(signal),
}))

export const counterpartyRelations = relations(counterparty, ({ many }) => ({
  companyLinks: many(companyCounterparty),
}))

export const companyCounterpartyRelations = relations(
  companyCounterparty,
  ({ one }) => ({
    company: one(company, {
      fields: [companyCounterparty.companyId],
      references: [company.id],
    }),
    counterparty: one(counterparty, {
      fields: [companyCounterparty.counterpartyId],
      references: [counterparty.id],
    }),
  }),
)

export const companyRevenueRelations = relations(companyRevenue, ({ one }) => ({
  company: one(company, {
    fields: [companyRevenue.companyId],
    references: [company.id],
  }),
}))

export const grossProfitFactRelations = relations(
  grossProfitFact,
  ({ one }) => ({
    account: one(companyAccount, {
      fields: [grossProfitFact.companyAccountId],
      references: [companyAccount.id],
    }),
    manager: one(user, {
      fields: [grossProfitFact.managerUserId],
      references: [user.id],
      relationName: 'grossProfitFactManager',
    }),
    department: one(department, {
      fields: [grossProfitFact.departmentId],
      references: [department.id],
    }),
  }),
)

export const companyContactRelations = relations(companyContact, ({ one }) => ({
  company: one(company, {
    fields: [companyContact.companyId],
    references: [company.id],
  }),
  role: one(contactRole, {
    fields: [companyContact.contactRoleId],
    references: [contactRole.id],
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
  leads: many(lead),
  tenders: many(tender),
  signals: many(signal),
  meetings: many(meeting),
  targetActions: many(targetAction),
}))

export const meetingRelations = relations(meeting, ({ one, many }) => ({
  company: one(company, {
    fields: [meeting.companyId],
    references: [company.id],
  }),
  organizer: one(user, {
    fields: [meeting.organizerId],
    references: [user.id],
    relationName: 'meetingOrganizer',
  }),
  department: one(department, {
    fields: [meeting.departmentId],
    references: [department.id],
  }),
  account: one(companyAccount, {
    fields: [meeting.accountId],
    references: [companyAccount.id],
  }),
  lead: one(lead, {
    fields: [meeting.leadId],
    references: [lead.id],
  }),
  tender: one(tender, {
    fields: [meeting.tenderId],
    references: [tender.id],
  }),
  participants: many(meetingParticipant),
  externalParticipants: many(meetingExternalParticipant),
}))

export const meetingParticipantRelations = relations(
  meetingParticipant,
  ({ one }) => ({
    meeting: one(meeting, {
      fields: [meetingParticipant.meetingId],
      references: [meeting.id],
    }),
    user: one(user, {
      fields: [meetingParticipant.userId],
      references: [user.id],
    }),
  }),
)

export const meetingExternalParticipantRelations = relations(
  meetingExternalParticipant,
  ({ one }) => ({
    meeting: one(meeting, {
      fields: [meetingExternalParticipant.meetingId],
      references: [meeting.id],
    }),
    contact: one(companyContact, {
      fields: [meetingExternalParticipant.contactId],
      references: [companyContact.id],
    }),
  }),
)

export const targetActionTypeRelations = relations(
  targetActionType,
  ({ many }) => ({
    actions: many(targetAction),
  }),
)

export const targetActionRelations = relations(targetAction, ({ one }) => ({
  type: one(targetActionType, {
    fields: [targetAction.typeId],
    references: [targetActionType.id],
  }),
  responsible: one(user, {
    fields: [targetAction.responsibleUserId],
    references: [user.id],
    relationName: 'targetActionResponsible',
  }),
  department: one(department, {
    fields: [targetAction.departmentId],
    references: [department.id],
  }),
  account: one(companyAccount, {
    fields: [targetAction.accountId],
    references: [companyAccount.id],
  }),
  lead: one(lead, {
    fields: [targetAction.leadId],
    references: [lead.id],
  }),
  tender: one(tender, {
    fields: [targetAction.tenderId],
    references: [tender.id],
  }),
  signal: one(signal, {
    fields: [targetAction.signalId],
    references: [signal.id],
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

export const changelogReleaseRelations = relations(
  changelogRelease,
  ({ one }) => ({
    author: one(user, {
      fields: [changelogRelease.authorId],
      references: [user.id],
    }),
  }),
)

export const leadRelations = relations(lead, ({ one }) => ({
  company: one(company, {
    fields: [lead.companyId],
    references: [company.id],
  }),
  department: one(department, {
    fields: [lead.departmentId],
    references: [department.id],
  }),
  responsible: one(user, {
    fields: [lead.responsibleUserId],
    references: [user.id],
    relationName: 'leadResponsible',
  }),
  industry: one(industry, {
    fields: [lead.industryId],
    references: [industry.id],
  }),
  source: one(source, {
    fields: [lead.sourceId],
    references: [source.id],
  }),
  lostReason: one(refusalReason, {
    fields: [lead.lostReasonId],
    references: [refusalReason.id],
    relationName: 'leadLostReason',
  }),
}))

export const tenderRelations = relations(tender, ({ one }) => ({
  company: one(company, {
    fields: [tender.companyId],
    references: [company.id],
  }),
  department: one(department, {
    fields: [tender.departmentId],
    references: [department.id],
  }),
  responsible: one(user, {
    fields: [tender.responsibleUserId],
    references: [user.id],
    relationName: 'tenderResponsible',
  }),
  approver: one(user, {
    fields: [tender.approverUserId],
    references: [user.id],
    relationName: 'tenderApprover',
  }),
  industry: one(industry, {
    fields: [tender.industryId],
    references: [industry.id],
  }),
  lostReason: one(refusalReason, {
    fields: [tender.lostReasonId],
    references: [refusalReason.id],
    relationName: 'tenderLostReason',
  }),
}))

export const signalRelations = relations(signal, ({ one }) => ({
  company: one(company, {
    fields: [signal.companyId],
    references: [company.id],
  }),
  department: one(department, {
    fields: [signal.departmentId],
    references: [department.id],
  }),
  responsible: one(user, {
    fields: [signal.responsibleUserId],
    references: [user.id],
    relationName: 'signalResponsible',
  }),
  industry: one(industry, {
    fields: [signal.industryId],
    references: [industry.id],
  }),
  signalType: one(signalTypeTable, {
    fields: [signal.signalTypeId],
    references: [signalTypeTable.id],
  }),
}))

export const contactRoleRelations = relations(contactRole, ({ many }) => ({
  contacts: many(companyContact),
}))

export const signalTypeRelations = relations(signalTypeTable, ({ many }) => ({
  signals: many(signal),
}))

export const sourceRelations = relations(source, ({ many }) => ({
  leads: many(lead),
}))

export const refusalReasonRelations = relations(refusalReason, ({ many }) => ({
  leads: many(lead, { relationName: 'leadLostReason' }),
  tenders: many(tender, { relationName: 'tenderLostReason' }),
}))

export const tagRelations = relations(tag, () => ({}))
