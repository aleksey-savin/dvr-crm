// Domain / view types — composed from DB types with extra fields, nested relations, or
// picked subsets. Do NOT put raw Drizzle InferSelectModel / InferInsertModel types here
// — those belong in src/db/types.ts.

// ─── Shared enums ────────────────────────────────────────────────────────────

export type TodoStatus = 'not started' | 'in progress' | 'completed'

export type AccountType = 'client' | 'wishlist' | 'prospect' | 'lost'

export type WishlistState = 'active' | 'basement' | 'archived'

// ─── Table row types (used in DataTable columns) ─────────────────────────────

/** Row shape for the active (non-lost) clients DataTable */
export type ClientAccountRow = {
  id: string
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
