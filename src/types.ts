// Domain / view types — composed from DB types with extra fields, nested relations, or
// picked subsets. Do NOT put raw Drizzle InferSelectModel / InferInsertModel types here
// — those belong in src/db/types.ts.

// ─── Shared enums ────────────────────────────────────────────────────────────

export type TodoStatus = 'not started' | 'in progress' | 'completed'

export type AccountType = 'client' | 'wishlist' | 'prospect' | 'lost'

export type WishlistState = 'active' | 'basement' | 'archived'

export type ChangelogStatus = 'draft' | 'published'

// ─── Shared picked option types ─────────────────────────────────────────────

export type DepartmentOption = {
  id: string
  name: string
  departmentType?: 'sales' | 'production' | 'administrative'
  parentId?: string | null
  accentColor?: string | null
}

export type ParentDepartmentRow = {
  id: string
  name: string
  parentId: string | null
}

export type ParentDepartmentOption = ParentDepartmentRow & {
  depth: number
}

export type UserOption = {
  id: string
  name: string
  departmentId?: string | null
}

export type UserRoleOption = UserOption & {
  role: string
}

export type UserPositionOption = UserOption & {
  position: string | null
}

export type CompanyOption = {
  id: string
  name: string
}

export type InitiativeOption = {
  id: string
  title: string
  companyId: string | null
  departmentId: string | null
  responsibleUserId: string | null
}

export type CompanyAccountOption = {
  id: string
  companyName: string | null
}

// ─── Table row types (used in DataTable columns) ─────────────────────────────

/** Row shape for the active (non-lost) clients DataTable */
export type ClientAccountRow = {
  id: string
  companyId: string
  /** company.name */
  name: string
  /** department.name (business unit) */
  businessUnit: string
  gpLastYear: string | null
  forecastCurrentYear: string | null
  risksCount: number
  upsellingCount: number
  marketerTodosCount: number
  managerTodosCount: number
  /** owner user name */
  owner: string | null
  isTarget: boolean
  isLost: boolean
}

/** Row shape for the lost clients DataTable */
export type LostClientAccountRow = {
  id: string
  companyId: string
  name: string
  businessUnit: string
  potentialNextYear: string | null
  lostReasons: string | null
  upsellingCount: number
  marketerTodosCount: number
  managerTodosCount: number
  owner: string | null
}

/** Todo item embedded in a WishlistAccountRow */
export type WishlistTodo = {
  id: string
  name: string
  status: TodoStatus
}

/** Row shape for the wishlist DataTable */
export type WishlistAccountRow = {
  id: string
  companyId: string
  companyName: string
  businessUnitIds: string[]
  businessUnits: string[]
  industry: string | null
  regionalMarketPosition: string | null
  revenueLastYear: string | null
  revenueTwoYearsAgo: string | null
  why: string | null
  wishlistOffer: string | null
  contactNotes: string | null
  hooks: string[]
  todos: WishlistTodo[]
  commentsCount: number
  responsibles: string[]
  wishlistState: WishlistState | null
  position: number | null
}

/** Account status entry embedded in a CompanyRow */
export type CompanyAccountStatus = {
  /** business unit name */
  departmentName: string
  isTarget: boolean
  isLost: boolean
}

/** Row shape for the companies DataTable */
export type CompanyRow = {
  id: string
  name: string
  description: string | null
  regionalMarketPosition: string | null
  industry: string | null
  /** client-type accounts for this company */
  clients: CompanyAccountStatus[]
  /** true if the company has at least one wishlist-type account */
  isWishlist: boolean
  revenueLastYear: string | null
  revenueTwoYearsAgo: string | null
}

export type Todo = {
  id: string
  name: string
  client: { id: string; name: string; accountType: AccountType } | null
  creator: string
  createdAt: Date
  responsibles: string[]
  deadline: Date | null
  status: TodoStatus
  completedAt: Date | null
  departmentId: string | null
  department: string | null
}

// ─── My company view types ──────────────────────────────────────────────────

export type DepartmentUser = {
  id: string
  name: string
  position: string | null
  phone: string | null
  image: string | null
}

export type DepartmentRow = {
  id: string
  name: string
  departmentType: 'sales' | 'production' | 'administrative'
  description: string | null
  accentColor: string | null
  headUserId: string | null
  head: DepartmentUser | null
  parentId: string | null
  users: DepartmentUser[]
}

export type DepartmentNode = DepartmentRow & {
  children: DepartmentNode[]
}

export type EmployeeRow = {
  id: string
  name: string
  email: string
  role: string
  image: string | null
  departmentId: string | null
  departmentName: string | null
  position: string | null
  phone: string | null
  lastActivityAt: Date | string | null
}

export type ChangelogReleaseRow = {
  id: string
  version: string
  title: string
  summary: string | null
  content: string
  status: ChangelogStatus
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  authorName: string | null
}

// ─── Detail view embedded item types ────────────────────────────────────────

export type YearValue = {
  id: string
  year: number
  value: string
  createdAt: Date
}

export type Revenue = YearValue

export type GrossProfit = YearValue

export type TargetForecast = YearValue

export type TextEntry = {
  id: string
  description: string
  createdAt: Date
}

export type Risk = TextEntry

export type Upselling = TextEntry

export type Hook = TextEntry

export type Contact = {
  id: string
  name: string
  position: string | null
  description: string | null
  contacts: string | null
  phone: string | null
  email: string | null
  telegram: string | null
  max: string | null
  contactRoleId: string | null
  contactRoleName: string | null
}

export type Counterparty = {
  id: string
  name: string
  fullName: string | null
  tin: string | null
  bankAccount: string | null
}

export type AccountTodoItem = {
  id: string
  name: string
  status: TodoStatus
  deadline: Date
  completedAt: Date | null
  archivedAt: Date | null
  createdAt: Date
  responsibleUsers: Array<{
    user: UserOption
  }>
}

export type TodoActionItem = {
  id: string
  status: TodoStatus
  completedAt: Date | null
  archivedAt: Date | null
  responsibleUsers: Array<{
    user: { id: string }
  }>
}

export type UserFormUser = {
  id: string
  name: string
  email: string
  image?: string | null
  role?: string | null
  departmentId?: string | null
  position?: string | null
  phone?: string | null
}

// ─── New Business Sources ────────────────────────────────────────────────────

export type UserRow = {
  id: string
  name: string
  email: string
  role: string | null
  banned: boolean | null
  createdAt: Date
}

export type IndustryRow = {
  id: string
  name: string
  createdAt: Date
}

export type ContactRoleRow = {
  id: string
  name: string
  createdAt: Date
}

export type SignalTypeRow = {
  id: string
  name: string
  createdAt: Date
}

export type MeetingRoomRow = {
  id: string
  name: string
  createdAt: Date
}

export type SourceRow = {
  id: string
  name: string
  createdAt: Date
}

export type RefusalReasonEntity = 'lead' | 'tender' | 'signal'

export type RefusalReasonRow = {
  id: string
  name: string
  entityTypes: RefusalReasonEntity[]
  createdAt: Date
}

export type TagRow = {
  id: string
  name: string
  createdAt: Date
}

export type EntityStatus = 'new' | 'in_progress' | 'converted' | 'rejected'

export type LeadStatus = EntityStatus

export type EntityType = 'lead' | 'tender' | 'signal'

export type EntityStageOption = {
  id: string
  name: string
  color: string
  order: number
}

export type LeadStageOption = EntityStageOption

export type LeadRow = {
  id: string
  title: string
  status: LeadStatus
  sourceId: string | null
  sourceName: string | null
  lostReasonId: string | null
  lostReasonName: string | null
  stageId: string | null
  stageName: string | null
  stageColor: string | null
  stageOrder: number | null
  budget: string | null
  dueDate: string | null
  companyId: string | null
  companyName: string | null
  departmentId: string | null
  departmentName: string | null
  departmentAccentColor: string | null
  responsibleUserId: string | null
  responsibleUserName: string | null
  industryId: string | null
  industryName: string | null
  archivedAt: Date | null
  createdAt: Date
}

export type TenderStatus = EntityStatus

export type TenderStageOption = EntityStageOption

export type TenderRow = {
  id: string
  title: string
  status: TenderStatus
  stageId: string | null
  stageName: string | null
  stageColor: string | null
  stageOrder: number | null
  amount: string | null
  deadline: string | null
  platform: string | null
  url: string | null
  lostReasonId: string | null
  lostReasonName: string | null
  companyId: string | null
  companyName: string | null
  departmentId: string | null
  departmentName: string | null
  departmentAccentColor: string | null
  responsibleUserId: string | null
  responsibleUserName: string | null
  approverUserId: string | null
  approverUserName: string | null
  industryId: string | null
  industryName: string | null
  archivedAt: Date | null
  createdAt: Date
}

export type SignalStatus = EntityStatus

export type SignalStageOption = EntityStageOption

export type SignalRow = {
  id: string
  title: string
  status: SignalStatus
  signalTypeId: string | null
  signalTypeName: string | null
  stageId: string | null
  stageName: string | null
  stageColor: string | null
  stageOrder: number | null
  rating: number | null
  lostReasonId: string | null
  lostReasonName: string | null
  companyId: string | null
  companyName: string | null
  departmentId: string | null
  departmentName: string | null
  departmentAccentColor: string | null
  responsibleUserId: string | null
  responsibleUserName: string | null
  industryId: string | null
  industryName: string | null
  archivedAt: Date | null
  createdAt: Date
}

// ─── Pipeline & Initiative ────────────────────────────────────────────────────

export type InitiativeSource =
  | 'lead'
  | 'signal'
  | 'tender'
  | 'account'
  | 'manual'

export type PipelineOption = {
  id: string
  name: string
}

export type PipelineStageOption = {
  id: string
  name: string
  color: string
  order: number
  isWon: boolean
  isLost: boolean
}

export type PipelineWithStages = {
  id: string
  name: string
  description: string | null
  stages: PipelineStageOption[]
  departmentIds: string[]
}

export type InitiativeRow = {
  id: string
  title: string
  budget: string | null
  dueDate: string | null
  closedAt: Date | null
  sourceType: InitiativeSource
  sourceLeadId: string | null
  sourceSignalId: string | null
  sourceTenderId: string | null
  pipelineId: string | null
  pipelineName: string | null
  stageId: string | null
  stageName: string | null
  stageColor: string | null
  stageOrder: number | null
  stageIsWon: boolean | null
  stageIsLost: boolean | null
  companyAccountId: string | null
  companyId: string | null
  companyName: string | null
  departmentId: string | null
  departmentName: string | null
  departmentAccentColor: string | null
  responsibleUserId: string | null
  responsibleUserName: string | null
  refusalReasonId: string | null
  refusalReasonName: string | null
  createdAt: Date
  updatedAt: Date
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export type MeetingStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'

export type MeetingType = 'client' | 'internal'

export type MeetingLocationType = 'client_site' | 'office'

export type TargetActionStatus = 'planned' | 'completed' | 'cancelled'

export type TargetActionSource =
  | 'meeting'
  | 'initiative'
  | 'tender'
  | 'lead'
  | 'signal'
  | 'proposal'
  | 'manual'

// Плоское представление вложенного документа (совпадает с DocumentItem
// из document-uploader); используется в доменных типах сущностей.
export type DocumentRef = {
  id: string
  name: string
  url: string
}

export type MeetingRow = {
  id: string
  title: string
  scheduledAt: Date
  endedAt: Date | null
  status: MeetingStatus
  meetingType: MeetingType
  locationType: MeetingLocationType
  meetingRoomId: string | null
  meetingRoomName: string | null
  summary: string | null
  cancelReason: string | null
  rescheduleCount: number
  organizerId: string | null
  organizerName: string | null
  departmentId: string | null
  departmentName: string | null
  companyId: string | null
  companyName: string | null
  participantCount: number
  createdAt: Date
}

export type MeetingParticipant = {
  userId: string
  name: string
}

export type MeetingExternalParticipant = {
  id: string
  name: string
  contactId: string | null
}

export type MeetingDetail = MeetingRow & {
  participants: MeetingParticipant[]
  externalParticipants: MeetingExternalParticipant[]
  leadId: string | null
  tenderId: string | null
  accountId: string | null
  initiativeId: string | null
  initiativeTitle: string | null
  rescheduledFromMeetingId: string | null
  documents: DocumentRef[]
}

export type MeetingRoomOption = {
  id: string
  name: string
}

export type RoomConflict = {
  id: string
  title: string
  scheduledAt: Date
  endedAt: Date
}

export type TargetActionTypeRow = {
  id: string
  name: string
  slug: string
  isSystem: boolean
  isPlannable: boolean
  createdAt: Date
}

export type TargetActionRow = {
  id: string
  typeId: string
  typeName: string
  typeSlug: string
  responsibleUserId: string | null
  responsibleUserName: string | null
  departmentId: string | null
  departmentName: string | null
  plannedAt: string
  completedAt: Date | null
  status: TargetActionStatus
  result: string | null
  reason: string | null
  sourceType: TargetActionSource
  sourceId: string | null
  initiativeId: string | null
  proposalId: string | null
  createdAt: Date
}

// ─── Target Action Plan / KPI report ─────────────────────────────────────────

export type TargetActionPlanStatus = 'pending' | 'approved'

/**
 * Одна строка отчёта план/факт: связка (менеджер × тип ЦД) за месяц.
 * Используется и в менеджерском виде (свои строки), и в руководительском
 * (группировка по менеджеру через DataTable.groupBy).
 */
export type TargetActionPlanRow = {
  userId: string
  userName: string
  departmentId: string | null
  departmentName: string | null
  typeId: string
  typeName: string
  planId: string | null
  plannedCount: number
  factCount: number
  status: TargetActionPlanStatus
}

export type TargetActionReport = {
  year: number
  month: number
  rows: TargetActionPlanRow[]
  /** true — текущий пользователь руководитель/admin (может править чужие планы). */
  canManageOthers: boolean
}

/** Сводка по менеджеру для дашборда руководителя. */
export type TargetActionManagerSummary = {
  userId: string
  userName: string
  departmentId: string | null
  departmentName: string | null
  totalPlanned: number
  totalFact: number
}

export type TargetActionDashboard = {
  month: number
  year: number
  /** План/факт текущего пользователя по типам (менеджерский виджет). */
  mine: TargetActionPlanRow[]
  /** true — пользователь руководитель/admin (показываем сводку по команде). */
  isHead: boolean
  team: TargetActionManagerSummary[] | null
}

// ─── Target Action analytics report (/target-actions) ────────────────────────

export type TargetActionPeriodType = 'month' | 'quarter' | 'year'

export type TargetActionPeriod = {
  type: TargetActionPeriodType
  year: number
  /** month 1–12 | quarter 1–4 | ignored (0) for 'year' */
  periodIndex: number
}

/** One manager × one target-action type cell. percent is null when planned === 0. */
export type TargetActionTypeCell = {
  typeId: string
  planned: number
  fact: number
  percent: number | null
}

export type TargetActionAnalyticsType = {
  id: string
  name: string
  /** Fact-only types (isPlannable=false) show count only — no plan, no percent. */
  isPlannable: boolean
}

/** One manager row of the analytics matrix; cells keyed by typeId. */
export type TargetActionAnalyticsRow = {
  userId: string
  userName: string
  departmentId: string | null
  departmentName: string | null
  cells: Record<string, TargetActionTypeCell>
  totalPlanned: number
  totalFact: number
  overallPercent: number | null
}

export type TargetActionAnalytics = {
  period: TargetActionPeriod
  /** resolved inclusive ISO range (yyyy-mm-dd). */
  start: string
  end: string
  label: string
  types: TargetActionAnalyticsType[]
  rows: TargetActionAnalyticsRow[]
  totals: {
    byType: Record<
      string,
      { planned: number; fact: number; percent: number | null }
    >
    totalPlanned: number
    totalFact: number
    overallPercent: number | null
  }
}

// ─── Manager detail (Sheet) ──────────────────────────────────────────────────

export type ManagerReportClient = {
  accountId: string
  companyId: string
  companyName: string
  businessUnit: string | null
  isTarget: boolean
  isLost: boolean
}

/** One labelled detail line of a completed action; companyId makes it a link. */
export type ManagerActionDetail = {
  label: string
  value: string
  companyId?: string | null
}

/** A single completed target action with the concrete context that produced it. */
export type ManagerCompletedAction = {
  id: string
  typeId: string
  typeName: string
  completedAt: Date
  sourceType: TargetActionSource
  /** Title of the linked initiative (initiative → title). */
  initiativeTitle: string | null
  /** Meeting context when the action came from a meeting. */
  meetingId: string | null
  meetingTitle: string | null
  meetingAt: Date | null
  /** Meeting length in minutes (endedAt − scheduledAt), computed server-side. */
  meetingDurationMin: number | null
  meetingSummary: string | null
  meetingParticipants: string[]
  /** Company resolved via the linked initiative (initiative → company). */
  companyId: string | null
  companyName: string | null
  /** Only the populated context lines (client, initiative, КП, lead, …). */
  details: ManagerActionDetail[]
  result: string | null
  reason: string | null
}

export type ManagerReportDetail = {
  user: {
    id: string
    name: string
    position: string | null
    phone: string | null
    email: string
    image: string | null
    departmentName: string | null
  }
  summary: TargetActionAnalyticsRow
  types: TargetActionAnalyticsType[]
  clients: ManagerReportClient[]
  completedActions: ManagerCompletedAction[]
}

// ─── Proposal (Коммерческое предложение) ─────────────────────────────────────

export type ProposalStatus = 'draft' | 'prepared' | 'approved' | 'sent'

export type ProposalRow = {
  id: string
  initiativeId: string
  initiativeTitle: string | null
  version: number
  status: ProposalStatus
  /** Вычисляемое: КП с наибольшим номером версии в инициативе. */
  isCurrent: boolean
  description: string | null
  senderUserId: string | null
  senderUserName: string | null
  preparedAt: Date | null
  approvedAt: Date | null
  sentAt: Date | null
  createdAt: Date
  updatedAt: Date
  documents: DocumentRef[]
}

// ─── Reports — Target clients (план/факт по менеджерам, лист «ГКС») ───────────

export type ReportSegment = 'target' | 'nontarget'

export type ReportManager = {
  id: string
  name: string
}

// Per-manager fact for a single client row (prior year + current year)
export type ClientManagerFact = {
  lastYearFact: number
  factYtd: number
}

// One client row in the целевые / нецелевые table
export type TargetClientReportRow = {
  accountId: string
  companyId: string
  name: string
  managers: string[]
  gpLastYear: number | null
  forecast: number | null
  factYtd: number | null
  // per-manager ВП breakdown (keyed by managerId) — for the client × manager matrix
  byManager: Record<string, ClientManagerFact>
}

// Per-manager aggregates within one segment
export type SegmentManagerCell = {
  managerId: string
  lastYearFact: number
  plan: number
  forecast: number
  factYtd: number
}

export type SegmentTotals = {
  lastYearFact: number
  plan: number
  forecast: number
  factYtd: number
  clientCount: number
  avgCheckLastYear: number | null
}

export type ReportSegmentData = {
  rows: TargetClientReportRow[]
  byManager: SegmentManagerCell[]
  totals: SegmentTotals
}

// Combined (target + nontarget) per-manager view — «ОБЩИЕ» + «Цель НОВЫЕ»
export type CombinedManagerCell = {
  managerId: string
  plan: number
  forecast: number
  factYtd: number
  newTarget: number
}

export type TargetClientsReport = {
  year: number
  lastYear: number
  departmentId: string
  managers: ReportManager[]
  target: ReportSegmentData
  nontarget: ReportSegmentData
  combined: {
    byManager: CombinedManagerCell[]
    totals: {
      plan: number
      forecast: number
      factYtd: number
      newTarget: number
    }
  }
}

// Sales plan admin row («Планы продаж»)
export type SalesPlanRow = {
  id: string
  departmentId: string
  departmentName: string
  userId: string
  userName: string
  year: number
  segment: ReportSegment
  value: string
}
