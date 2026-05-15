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
  /** Single business unit name */
  businessUnit: string
  industry: string | null
  regionalMarketPosition: string | null
  revenueLastYear: string | null
  revenueTwoYearsAgo: string | null
  why: string | null
  hooks: string[]
  todos: WishlistTodo[]
  commentsCount: number
  /** Single responsible user name */
  responsible: string | null
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

export type LeadStatus = 'new' | 'in_progress' | 'converted' | 'rejected'

export type LeadRow = {
  id: string
  title: string
  status: LeadStatus
  source: string | null
  budget: string | null
  dueDate: string | null
  companyId: string | null
  companyName: string | null
  departmentId: string | null
  departmentName: string | null
  responsibleUserId: string | null
  responsibleUserName: string | null
  industryId: string | null
  industryName: string | null
  createdAt: Date
}

export type TenderStatus =
  | 'new'
  | 'evaluation'
  | 'approval'
  | 'preparation'
  | 'submitted'
  | 'won'
  | 'lost'
  | 'rejected'
  | 'archived'

export type TenderRow = {
  id: string
  title: string
  status: TenderStatus
  amount: string | null
  deadline: string | null
  platform: string | null
  url: string | null
  companyId: string | null
  companyName: string | null
  departmentId: string | null
  departmentName: string | null
  responsibleUserId: string | null
  responsibleUserName: string | null
  approverUserId: string | null
  approverUserName: string | null
  industryId: string | null
  industryName: string | null
  createdAt: Date
}

export type SignalType = 'recommendation' | 'news' | 'direct_contact' | 'other'

export type SignalStatus = 'new' | 'in_progress' | 'converted' | 'archived'

export type SignalRow = {
  id: string
  title: string
  status: SignalStatus
  signalType: SignalType
  rating: number | null
  companyId: string | null
  companyName: string | null
  departmentId: string | null
  departmentName: string | null
  responsibleUserId: string | null
  responsibleUserName: string | null
  industryId: string | null
  industryName: string | null
  createdAt: Date
}
