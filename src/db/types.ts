import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type {
  user,
  session,
  account,
  verification,
  todo,
  todoResponsibleUsers,
  department,
  industry,
  contactRole,
  signalTypeTable,
  source,
  refusalReason,
  tag,
  company,
  counterparty,
  companyCounterparty,
  companyAccount,
  companyAccountDepartments,
  companyAccountManagers,
  accountRisk,
  accountGrossProfit,
  accountTargetForecast,
  accountUpsellingOpportunity,
  accountHook,
  companyRevenue,
  grossProfitFact,
  companyContact,
  comment,
  commentAttachment,
  commentRead,
  meeting,
  meetingParticipant,
  meetingExternalParticipant,
  targetActionType,
  targetAction,
  apiKey,
  clientClassificationSettings,
  changelogRelease,
  lead,
  tender,
  signal,
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

export type SelectIndustry = InferSelectModel<typeof industry>
export type InsertIndustry = InferInsertModel<typeof industry>
export type UpdateIndustry = Partial<
  Omit<InsertIndustry, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectCompany = InferSelectModel<typeof company>
export type InsertCompany = InferInsertModel<typeof company>
export type UpdateCompany = Partial<
  Omit<InsertCompany, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectCounterparty = InferSelectModel<typeof counterparty>
export type InsertCounterparty = InferInsertModel<typeof counterparty>
export type UpdateCounterparty = Partial<
  Omit<InsertCounterparty, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectCompanyCounterparty = InferSelectModel<
  typeof companyCounterparty
>
export type InsertCompanyCounterparty = InferInsertModel<
  typeof companyCounterparty
>

// ─── Company Account (Аккаунт компании в бизнес-юните) ───────────────────────

export type SelectCompanyAccount = InferSelectModel<typeof companyAccount>
export type InsertCompanyAccount = InferInsertModel<typeof companyAccount>
export type UpdateCompanyAccount = Partial<
  Omit<InsertCompanyAccount, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectCompanyAccountManager = InferSelectModel<
  typeof companyAccountManagers
>
export type InsertCompanyAccountManager = InferInsertModel<
  typeof companyAccountManagers
>

export type SelectCompanyAccountDepartment = InferSelectModel<
  typeof companyAccountDepartments
>
export type InsertCompanyAccountDepartment = InferInsertModel<
  typeof companyAccountDepartments
>

export type SelectGrossProfitFact = InferSelectModel<typeof grossProfitFact>
export type InsertGrossProfitFact = InferInsertModel<typeof grossProfitFact>
export type UpdateGrossProfitFact = Partial<
  Omit<InsertGrossProfitFact, 'id' | 'createdAt' | 'updatedAt'>
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
export type UpdateMeeting = Partial<
  Omit<InsertMeeting, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectMeetingParticipant = InferSelectModel<
  typeof meetingParticipant
>
export type InsertMeetingParticipant = InferInsertModel<
  typeof meetingParticipant
>

export type SelectMeetingExternalParticipant = InferSelectModel<
  typeof meetingExternalParticipant
>
export type InsertMeetingExternalParticipant = InferInsertModel<
  typeof meetingExternalParticipant
>

// ─── Target Action Type ───────────────────────────────────────────────────────

export type SelectTargetActionType = InferSelectModel<typeof targetActionType>
export type InsertTargetActionType = InferInsertModel<typeof targetActionType>
export type UpdateTargetActionType = Partial<
  Omit<InsertTargetActionType, 'id' | 'createdAt' | 'updatedAt'>
>

// ─── Target Action ────────────────────────────────────────────────────────────

export type SelectTargetAction = InferSelectModel<typeof targetAction>
export type InsertTargetAction = InferInsertModel<typeof targetAction>
export type UpdateTargetAction = Partial<
  Omit<InsertTargetAction, 'id' | 'createdAt' | 'updatedAt'>
>

// ─── API Key ─────────────────────────────────────────────────────────────────

export type SelectApiKey = InferSelectModel<typeof apiKey>
export type InsertApiKey = InferInsertModel<typeof apiKey>
export type UpdateApiKey = Partial<
  Omit<InsertApiKey, 'id' | 'createdAt' | 'updatedAt'>
>

// ─── Client classification settings ─────────────────────────────────────────

export type SelectClientClassificationSettings = InferSelectModel<
  typeof clientClassificationSettings
>
export type InsertClientClassificationSettings = InferInsertModel<
  typeof clientClassificationSettings
>
export type UpdateClientClassificationSettings = Partial<
  Omit<InsertClientClassificationSettings, 'id' | 'createdAt' | 'updatedAt'>
>

// ─── Changelog ──────────────────────────────────────────────────────────────

export type SelectChangelogRelease = InferSelectModel<typeof changelogRelease>
export type InsertChangelogRelease = InferInsertModel<typeof changelogRelease>
export type UpdateChangelogRelease = Partial<
  Omit<InsertChangelogRelease, 'id' | 'createdAt' | 'updatedAt'>
>

// ─── Classifiers (справочники) ────────────────────────────────────────────────

export type SelectContactRole = InferSelectModel<typeof contactRole>
export type InsertContactRole = InferInsertModel<typeof contactRole>
export type UpdateContactRole = Partial<
  Omit<InsertContactRole, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectSignalType = InferSelectModel<typeof signalTypeTable>
export type InsertSignalType = InferInsertModel<typeof signalTypeTable>
export type UpdateSignalType = Partial<
  Omit<InsertSignalType, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectSource = InferSelectModel<typeof source>
export type InsertSource = InferInsertModel<typeof source>
export type UpdateSource = Partial<
  Omit<InsertSource, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectRefusalReason = InferSelectModel<typeof refusalReason>
export type InsertRefusalReason = InferInsertModel<typeof refusalReason>
export type UpdateRefusalReason = Partial<
  Omit<InsertRefusalReason, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectTag = InferSelectModel<typeof tag>
export type InsertTag = InferInsertModel<typeof tag>
export type UpdateTag = Partial<
  Omit<InsertTag, 'id' | 'createdAt' | 'updatedAt'>
>

// ─── New Business Sources ─────────────────────────────────────────────────────

export type SelectLead = InferSelectModel<typeof lead>
export type InsertLead = InferInsertModel<typeof lead>
export type UpdateLead = Partial<
  Omit<InsertLead, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectTender = InferSelectModel<typeof tender>
export type InsertTender = InferInsertModel<typeof tender>
export type UpdateTender = Partial<
  Omit<InsertTender, 'id' | 'createdAt' | 'updatedAt'>
>

export type SelectSignal = InferSelectModel<typeof signal>
export type InsertSignal = InferInsertModel<typeof signal>
export type UpdateSignal = Partial<
  Omit<InsertSignal, 'id' | 'createdAt' | 'updatedAt'>
>
