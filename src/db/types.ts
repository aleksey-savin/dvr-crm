import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type {
  user,
  session,
  account,
  verification,
  todo,
  todoResponsibleUsers,
  department,
  company,
  companyAccount,
  accountRisk,
  accountGrossProfit,
  accountTargetForecast,
  accountUpsellingOpportunity,
  accountHook,
  companyRevenue,
  companyContact,
  comment,
  commentAttachment,
  commentRead,
  meeting,
  apiKey,
  changelogRelease,
} from './schema'

// ─── Auth ────────────────────────────────────────────────────────────────────

export type SelectUser = InferSelectModel<typeof user>
export type InsertUser = InferInsertModel<typeof user>
export type UpdateUser = Partial<
  Omit<InsertUser, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectSession = InferSelectModel<typeof session>
export type InsertSession = InferInsertModel<typeof session>
export type UpdateSession = Partial<
  Omit<InsertSession, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectAccount = InferSelectModel<typeof account>
export type InsertAccount = InferInsertModel<typeof account>
export type UpdateAccount = Partial<
  Omit<InsertAccount, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectVerification = InferSelectModel<typeof verification>
export type InsertVerification = InferInsertModel<typeof verification>
export type UpdateVerification = Partial<
  Omit<InsertVerification, 'id' | 'createdAt' | 'updatedAt'>
>

// ─── Department (Бизнес-юнит) ────────────────────────────────────────────────

export type SelectDepartment = InferSelectModel<typeof department>
export type InsertDepartment = InferInsertModel<typeof department>
export type UpdateDepartment = Partial<
  Omit<InsertDepartment, 'id' | 'createdAt' | 'updatedAt'>
>

// ─── Company ─────────────────────────────────────────────────────────────────

export type SelectCompany = InferSelectModel<typeof company>
export type InsertCompany = InferInsertModel<typeof company>
export type UpdateCompany = Partial<
  Omit<InsertCompany, 'id' | 'createdAt' | 'updatedAt'>
>

// ─── Company Account (Аккаунт компании в бизнес-юните) ───────────────────────

export type SelectCompanyAccount = InferSelectModel<typeof companyAccount>
export type InsertCompanyAccount = InferInsertModel<typeof companyAccount>
export type UpdateCompanyAccount = Partial<
  Omit<InsertCompanyAccount, 'id' | 'createdAt' | 'updatedAt'>
>

// ─── Account sub-entities ────────────────────────────────────────────────────

export type SelectAccountRisk = InferSelectModel<typeof accountRisk>
export type InsertAccountRisk = InferInsertModel<typeof accountRisk>
export type UpdateAccountRisk = Partial<
  Omit<InsertAccountRisk, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectAccountGrossProfit = InferSelectModel<
  typeof accountGrossProfit
>
export type InsertAccountGrossProfit = InferInsertModel<
  typeof accountGrossProfit
>
export type UpdateAccountGrossProfit = Partial<
  Omit<InsertAccountGrossProfit, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectAccountTargetForecast = InferSelectModel<
  typeof accountTargetForecast
>
export type InsertAccountTargetForecast = InferInsertModel<
  typeof accountTargetForecast
>
export type UpdateAccountTargetForecast = Partial<
  Omit<InsertAccountTargetForecast, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectAccountUpsellingOpportunity = InferSelectModel<
  typeof accountUpsellingOpportunity
>
export type InsertAccountUpsellingOpportunity = InferInsertModel<
  typeof accountUpsellingOpportunity
>
export type UpdateAccountUpsellingOpportunity = Partial<
  Omit<InsertAccountUpsellingOpportunity, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectAccountHook = InferSelectModel<typeof accountHook>
export type InsertAccountHook = InferInsertModel<typeof accountHook>
export type UpdateAccountHook = Partial<
  Omit<InsertAccountHook, 'id' | 'createdAt' | 'updatedAt'>
>

// ─── Company sub-entities ────────────────────────────────────────────────────

export type SelectCompanyRevenue = InferSelectModel<typeof companyRevenue>
export type InsertCompanyRevenue = InferInsertModel<typeof companyRevenue>
export type UpdateCompanyRevenue = Partial<
  Omit<InsertCompanyRevenue, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectCompanyContact = InferSelectModel<typeof companyContact>
export type InsertCompanyContact = InferInsertModel<typeof companyContact>
export type UpdateCompanyContact = Partial<
  Omit<InsertCompanyContact, 'id' | 'createdAt' | 'updatedAt'>
>

// ─── Todo ────────────────────────────────────────────────────────────────────

export type SelectTodo = InferSelectModel<typeof todo>
export type InsertTodo = InferInsertModel<typeof todo>
export type UpdateTodo = Partial<
  Omit<InsertTodo, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectTodoResponsibleUsers = InferSelectModel<
  typeof todoResponsibleUsers
>
export type InsertTodoResponsibleUsers = InferInsertModel<
  typeof todoResponsibleUsers
>
export type UpdateTodoResponsibleUsers = Partial<
  Omit<InsertTodoResponsibleUsers, 'todoId' | 'userId'>
>

// ─── Comments ────────────────────────────────────────────────────────────────

export type SelectComment = InferSelectModel<typeof comment>
export type InsertComment = InferInsertModel<typeof comment>
export type UpdateComment = Partial<
  Omit<InsertComment, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectCommentAttachment = InferSelectModel<typeof commentAttachment>
export type InsertCommentAttachment = InferInsertModel<typeof commentAttachment>
export type UpdateCommentAttachment = Partial<
  Omit<InsertCommentAttachment, 'id' | 'createdAt'>
>

export type SelectCommentRead = InferSelectModel<typeof commentRead>
export type InsertCommentRead = InferInsertModel<typeof commentRead>
export type UpdateCommentRead = Partial<
  Omit<InsertCommentRead, 'commentId' | 'userId'>
>

// ─── Meeting ─────────────────────────────────────────────────────────────────

export type SelectMeeting = InferSelectModel<typeof meeting>
export type InsertMeeting = InferInsertModel<typeof meeting>
export type UpdateMeeting = Partial<Omit<InsertMeeting, 'id'>>

// ─── API Key ─────────────────────────────────────────────────────────────────

export type SelectApiKey = InferSelectModel<typeof apiKey>
export type InsertApiKey = InferInsertModel<typeof apiKey>
export type UpdateApiKey = Partial<
  Omit<InsertApiKey, 'id' | 'createdAt' | 'updatedAt'>
>

// ─── Changelog ──────────────────────────────────────────────────────────────

export type SelectChangelogRelease = InferSelectModel<typeof changelogRelease>
export type InsertChangelogRelease = InferInsertModel<typeof changelogRelease>
export type UpdateChangelogRelease = Partial<
  Omit<InsertChangelogRelease, 'id' | 'createdAt' | 'updatedAt'>
>
