# CLAUDE.md

Guidance for Claude Code when working with the **dvr-crm** project.

## Project Overview

Internal CRM system for DVR Group: client base management, sales, new business,
employee activity tracking, and management analytics, scoped by business units.
UI language is Russian.

**Stack:**

- TanStack Start (Vite + Nitro), file-based routing — TanStack Router
- TypeScript (strict)
- Drizzle ORM + PostgreSQL
- Better Auth (RBAC)
- shadcn/ui + Tailwind CSS v4
- Zod v4, TanStack Form, TanStack Table, Zustand
- Package manager: **pnpm**

**Project documentation:**

| File                | Contents                                                                           |
| ------------------- | ---------------------------------------------------------------------------------- |
| `ENTITIES.md`       | Full domain model: purpose, fields, relations, and business rules for every entity |
| `docs/tech_spec.md` | Technical specification: MVP scope, user roles, functional blocks                  |
| `API_USAGE.md`      | External REST API (`POST /api/meetings`, Bearer auth via API key)                  |

## Commands

```bash
pnpm dev          # dev server on :3000
pnpm build        # production build
pnpm test         # vitest run
pnpm lint         # eslint
pnpm format       # prettier --check
pnpm check        # prettier --write + eslint --fix

pnpm db:generate  # generate a migration from the schema
pnpm db:studio    # Drizzle Studio
```

**IMPORTANT — DB migrations:** after schema changes run **only**
`pnpm db:generate`. The user applies migrations themselves — never run
`pnpm db:migrate` or `pnpm db:push`.

Local DB is a Docker container; the port is configurable via `DATABASE_PORT`
(defaults to 5432): `DATABASE_PORT=5433 docker compose -f compose.dev.yml up -d db`.
With a non-default port, update `DATABASE_URL` in your local env file.

## Directory Structure

- `src/routes/` — file-based routes (TanStack Router/Start)
- `src/db/schema.ts` — single Drizzle schema file (all tables + relations)
- `src/db/index.ts` — Drizzle db instance (`export const db`)
- `src/db/types.ts` — raw DB types (Select / Insert / Update)
- `src/types.ts` — domain/view types (compositions of DB types)
- `src/components/ui/` — shadcn/ui components
- `src/components/<feature>/` — feature components (forms, dialogs, `actions.ts`)
- `src/components/tables/` — all table code (cols files + shared `DataTable`)
- `src/stores/` — Zustand stores (client-only state)
- `src/lib/utils.ts` — shared utilities (`cn`, etc.)
- `utils/auth.ts` — Better Auth server instance
- `utils/auth-client.ts` — Better Auth client instance (`authClient`)
- `utils/middleware.ts` — TanStack Start middleware (auth guard)
- `utils/permissions.ts` — RBAC (`ac`, roles `admin`, `manager`, `user`)
- `auth-schema.ts` — Better Auth base schema (do not edit manually)
- `drizzle.config.ts` — Drizzle Kit config (dialect: postgresql)
- `scripts/` — CLI scripts (seeds, xlsx import)

## Import Aliases

- `@/` → `src/` — use for all src imports
- `utils/` — bare (no alias) for auth/middleware/permissions imports
- Never use relative `../` imports when an alias is available

## TanStack Start

- ALWAYS use `createServerFn` for any server-side data access (DB queries, auth checks)
- ALWAYS load initial data via `loader` in `createFileRoute`, never in `useEffect`
- Read loader data with `Route.useLoaderData()` — never prop-drill it
- Use `router.invalidate()` after mutations to refresh loader data
- Use `router.navigate()` or `router.history.back()` for post-action navigation
- Never fetch data on the client with `useEffect` + `fetch` — use loaders or server functions
- The auth guard is already applied globally via `utils/middleware.ts`
- For server functions that need the current session/request: `getRequest()` from
  `@tanstack/react-start/server`, pass headers to `auth.api.*`
- Avoid `useEffect`, `useMemo`, `useCallback` unless absolutely necessary — prefer derived values and loaders

### Route file naming convention

- `entity.tsx` — list view with `<Outlet />`
- `entity.new.tsx` — create dialog (renders over the list)
- `entity.$id.update.tsx` — edit dialog
- `entity.$id.delete.tsx` — confirm-delete dialog
- `entity_.$id.view.tsx` — detail view (underscore = outside the list layout)

Modal routes open over the parent list route: the `open` prop is always
hardcoded to `true`, close via `router.navigate` or `router.history.back()`.

### Route file contents

Route files (`src/routes/`) are ONLY for routing concerns:

- `createFileRoute` config (loader, search params, error boundary)
- `RouteComponent` (thin shell — layout + data passing, no logic)

Route files must NOT contain: large JSX trees (>~60 lines in the component
body), inline form or table implementations, repeated UI blocks, or any logic
beyond calling a server function or reading loader data.

One route component per file — `function RouteComponent()` (not exported,
not named after the route).

## Server Functions

- All `createServerFn` calls live in `actions.ts` inside the component's
  feature folder (e.g. `src/components/companyAccounts/actions.ts`)
- Do NOT create `*.server.ts`, `actions.server.ts`, or route-level `actions.ts` files
- If a route needs server functions, put them in the matching feature's
  `actions.ts` and import them into the route
- Plain async helpers called only from within server handlers (e.g.
  `requireOwner`) live in the same `actions.ts` — no need to wrap them in `createServerFn`
- `inputValidator` is required on server functions that accept parameters

## Drizzle ORM

- All schema lives in `src/db/schema.ts` — one file, append new tables there
- Define relations with `relations()` alongside the table definition
- Instance: `import { db } from '@/db'`
- Prefer `db.query.<table>.findMany/findFirst` with `with:` for relational queries
- Operators `eq`, `and`, `or`, `inArray`, `isNull`, `isNotNull`, etc. — from `drizzle-orm`
- `db.insert().values().returning()` — for inserts that need the result
- `db.update().set().where().returning()` — for updates
- `db.delete().where()` — for deletes
- `db.transaction()` — for multi-step operations

Column conventions:

- Primary keys: `text('id').primaryKey()` (string UUIDs or cuid2)
- Timestamps: `timestamp('created_at').defaultNow().notNull()`
- Updated at: `timestamp('updated_at').$onUpdate(() => new Date()).notNull()`
- Foreign keys: always `{ onDelete: 'cascade' }` unless intentionally restricted
- Add `index()` on foreign key columns used in frequent queries

Schema changes that affect Better Auth tables must be synced with `auth-schema.ts`.

## Types

- **Raw DB types** (Select / Insert / Update) for every new entity — in `src/db/types.ts`
- **Domain/view types** (extensions and picks of DB types: with `role`, nested
  relations, field subsets) — in `src/types.ts`. Do NOT put them in stores
  or component files
- Derive Zod schemas for form validation from Drizzle tables via `drizzle-zod`
- Strict mode — no `any`; infer types from the Drizzle schema or Zod

## Better Auth / RBAC

- Server: `import { auth } from 'utils/auth'`; client: `import { authClient } from 'utils/auth-client'`
- Server-side auth calls always require `headers: request.headers` — get the
  request via `getRequest()` from `@tanstack/react-start/server`
- Roles: `admin`, `manager`, `user` — in `utils/permissions.ts`
- Permission statements: `company` (create/update/delete), `task` (create/update/delete/assign/unassign)
- Server-side permission check: `auth.api.userHasPermission()`
- Client-side admin actions: `authClient.admin.*`
- Auth handler at `src/routes/api/auth/$.ts` — do not modify
- `tanstackStartCookies()` is already configured — cookies are handled automatically
- Google (social) and email/password are both enabled

## UI/UX

### Base rules

- New shadcn/ui components: `pnpm dlx shadcn@latest add <component>`
- All UI components in `src/components/ui/`; conditional classes via `cn()` from `@/lib/utils`
- `<ResponsiveDialog>` from `@/components/ui/responsive-dialog` — for modal routes
- `<AlertDialog>` — for destructive confirmations (ban, delete)
- `sonner` (`toast`) — success/error notifications after mutations; toast texts in Russian
- Tailwind CSS v4 — no `tailwind.config.js`, configuration lives in CSS via `@theme`
- Do not use `next-themes` ThemeProvider patterns directly — the theme is already set up in `__root.tsx`
- Format money and numbers with `Intl.NumberFormat` using the `'ru-RU'` locale (`'RUB'` currency)

### Typography and font sizes

The working scale is four Tailwind sizes; never go above `text-lg` in content.
Reference implementations are the `Sheet`-based components
(`src/components/departments/department-members-sheet.tsx`, `src/components/ui/sheet.tsx`):

| Size                    | Usage                                                                                | Example from Sheet components                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `text-lg font-semibold` | Panel/dialog title                                                                   | `SheetTitle` (built into `ui/sheet.tsx`) — do not override                                                                                   |
| `text-base font-medium` | Section headings inside a panel; primary text (entity/person name)                   | `<div className="flex items-center gap-2 text-base font-medium"><CrownIcon className="size-4" />Руководитель</div>`; the name in `PersonRow` |
| `text-sm`               | The default working size: secondary data, descriptions, inline actions, empty states | `SheetDescription`; position and phone — `text-sm text-muted-foreground`; the «Изменить»/«Готово» toggle — `text-sm font-medium`             |
| `text-xs`               | Small auxiliary elements                                                             | avatar initials — `text-xs font-medium text-muted-foreground`                                                                                |

Principles:

- `text-sm` is the base content size of the app (the typography blocks in
  `styles.css` are also `text-sm leading-6`). When no size is set explicitly,
  the result should be `text-sm`, not `text-base`
- `text-base` — only for semantic emphasis (entity names, section headings),
  always paired with `font-medium`
- Secondary text is always de-emphasized with color (`text-muted-foreground`),
  not by shrinking it to `text-xs`
- Icons next to text — `size-4` (larger is fine in avatars/prominent spots)
- Do not set font sizes on Sheet/Dialog titles manually — use the built-in
  `SheetTitle`/`SheetDescription` with their default sizes

### Page header and the create action

- Page titles, breadcrumbs, and root-page create actions live only in
  `src/components/layout/app-breadcrumb.tsx`
- New root entity page → add its label and `showAddButton` setting to
  `ROUTE_LABELS` in `AppBreadcrumb`
- List pages do NOT render their own header/title or create button — the page
  body holds only filters, tables, empty states, and entity-specific content
- The standard create action is the `PlusIcon` button in `AppBreadcrumb`,
  linking to `/<entity>/new`

### Badge

Wrap count/status values in `<Badge>` with the appropriate variant:

- `destructive` — risks, errors, blocked
- `secondary` — neutral counts (todos, upsell, etc.)
- `default` — active/in-progress
- `success` — completed
- `warning` — pending/not started

Array values (e.g. a managers list): `<div className="flex flex-wrap gap-2">`
with a `<Badge variant="secondary">` per item.

### Standard components

- Delete components take an `entityId` prop, not the whole `entity` object
- File uploads — always `<DocumentUploader>` from
  `src/components/ui/document-uploader.tsx`: the component manages all upload
  state itself; you only provide the callbacks `onUpload(file, base64)` (upload
  the document → link it to the entity → return the `DocumentItem`) and
  `onRemove(doc)`; `accept` is optional (defaults to PDF/DOC/XLS/JPG/PNG)

## TanStack Table

- All table code lives in `src/components/tables/`
- Two files per entity: `<entity>-cols.tsx` (only `ColumnDef[]` + row type) and
  the reusable shared `<DataTable>` from `data-table.tsx`
- Never build a one-off table inline — always use `<DataTable>`
- Never duplicate `DataTable` — add new behaviour via optional props on
  `data-table.tsx`, do not create a parallel implementation

### Row type

- A plain TypeScript type (e.g. `export type Client = { ... }`) at the top of
  the cols file — the shape of data passed to the table, NOT the raw Drizzle type
- Map query results to this type in the loader/server function, before passing
  to `<DataTable>`; cols files stay free of query logic

### Column definitions (`<entity>-cols.tsx`)

- Export a single array: `export const columns: ColumnDef<EntityType>[]`
- Sortable columns: header is a `<Button variant="ghost">` with
  `column.toggleSorting()` and an `<ArrowUpDown>` icon; wrap in
  `<div className="flex justify-center">` for centered columns
- Numbers/currency: always `Intl.NumberFormat` (`'ru-RU'`, `'RUB'`), never render raw numbers
- The entity name cell is the standard view affordance and links to the detail route (`.../$id/view`)
- Actions column: always last, `id: 'actions'`, `header: ''`, right-aligned
  (`flex items-center justify-end gap-1`); reserved for entity-specific
  workflow actions. Do not add standard View/Edit/Delete buttons — edit/delete
  live on the detail page unless explicitly requested
- Footer (aggregates): define `footer` on numeric/badge columns that benefit
  from totals; the first footer cell always renders `'Итого'` — handled
  automatically by `DataTable`
- Zustand stores MAY be read inside `cell` renderers (e.g.
  `useDepartmentStore`) when column rendering depends on cross-route client state

### Filters and data

- Table filter controls — only `<MultiFilterCombobox>` from
  `@/components/tables/multi-filter-combobox`. Never use `<Select>` for table
  filters — every filter must support multi-selection
- Filter state lives in the route component as arrays (`useState<StatusType[]>([])`).
  Static option lists (statuses, types) are module-level constants; dynamic
  lists (users, industries) are derived inline from loader data each render
  (no `useMemo`) and only rendered when `options.length > 0`
- Pre-filter data BEFORE passing it to `<DataTable>` — apply all active filters
  in a single `.filter()` over loader data; filtering by Zustand state (e.g. by
  department) also happens before passing
- Do not add client-side pagination unless the dataset is confirmed to be large
  (>500 rows) — in that case filter/limit server-side in the loader
- Do not add row selection unless a bulk-action feature is explicitly required

## Component Extraction

Extract to `src/components/<feature>/` when:

- A JSX block exceeds ~50 lines
- A block has its own local state (`useState`, `useReducer`)
- A block is (or could be) reused across 2+ routes
- A form, table, or dialog has its own submission/mutation logic

Naming:

- Forms: `<EntityForm />` → `entity-form.tsx`
- Tables: `<EntityTable />` → `entity-table.tsx`
- Cards: `<EntityCard />` → `entity-card.tsx`
- Non-route-level dialogs: `entity-*-dialog.tsx`

Pass only what the component needs — derive everything else inside.
Loader data is fetched in the route and passed as props.

## Domain Model (summary)

Details for every entity (fields, relations, business rules) are in
`ENTITIES.md`. MVP scope is in `docs/tech_spec.md`.

- **Client model:** Company, Business Unit, Company Account in a Business Unit
  (the Company × Business Unit pairing — the attachment point for all
  operational work), Contact, Counterparty (legal entity)
- **New business:** Wish-list, Lead, Tender, Signal — inbound events that are
  converted into an Initiative after qualification
- **Sales:** Initiative (the central operational entity, bound to
  `company_account_id`, moves across kanban stages), Initiative Stage
  (configurable columns per business unit), Commercial Proposal (versioned,
  scoped to an initiative)
- **Activities:** Target Action, Task, Reminder, Meeting (meetings are also
  available via the external API, see `API_USAGE.md`; a meeting-room booking is
  an office meeting with `meetingRoomId` — there is no separate bookings table)
- **Finance and planning:** Goal, Sales Plan, Sales Fact
- **Classifiers:** action/signal types, statuses, contact roles, industries,
  sources, refusal reasons, tags
- Archive via `is_active` instead of physical deletion; historical relations
  are preserved after deactivation
