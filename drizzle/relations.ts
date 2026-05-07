import { relations } from "drizzle-orm/relations";
import { company, meeting, user, account, session, comments, department, todos, companyAccount, apiKey, commentAttachments, accountHooks, accountRisks, companyContact, accountTargetForecasts, accountUpsellingOpportunities, companyRevenue, accountGrossProfits, todoResponsibleUsers, commentReads } from "./schema";

export const meetingRelations = relations(meeting, ({one}) => ({
	company: one(company, {
		fields: [meeting.companyId],
		references: [company.id]
	}),
}));

export const companyRelations = relations(company, ({many}) => ({
	meetings: many(meeting),
	companyContacts: many(companyContact),
	companyRevenues: many(companyRevenue),
	companyAccounts: many(companyAccount),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({one, many}) => ({
	accounts: many(account),
	sessions: many(session),
	comments: many(comments),
	department: one(department, {
		fields: [user.departmentId],
		references: [department.id]
	}),
	todos: many(todos),
	apiKeys: many(apiKey),
	companyAccounts: many(companyAccount),
	todoResponsibleUsers: many(todoResponsibleUsers),
	commentReads: many(commentReads),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const commentsRelations = relations(comments, ({one, many}) => ({
	user: one(user, {
		fields: [comments.authorId],
		references: [user.id]
	}),
	commentAttachments: many(commentAttachments),
	commentReads: many(commentReads),
}));

export const departmentRelations = relations(department, ({many}) => ({
	users: many(user),
	todos: many(todos),
	companyAccounts: many(companyAccount),
}));

export const todosRelations = relations(todos, ({one, many}) => ({
	user: one(user, {
		fields: [todos.userId],
		references: [user.id]
	}),
	department: one(department, {
		fields: [todos.departmentId],
		references: [department.id]
	}),
	companyAccount: one(companyAccount, {
		fields: [todos.companyAccountId],
		references: [companyAccount.id]
	}),
	todoResponsibleUsers: many(todoResponsibleUsers),
}));

export const companyAccountRelations = relations(companyAccount, ({one, many}) => ({
	todos: many(todos),
	accountHooks: many(accountHooks),
	accountRisks: many(accountRisks),
	accountTargetForecasts: many(accountTargetForecasts),
	accountUpsellingOpportunities: many(accountUpsellingOpportunities),
	company: one(company, {
		fields: [companyAccount.companyId],
		references: [company.id]
	}),
	department: one(department, {
		fields: [companyAccount.businessUnitId],
		references: [department.id]
	}),
	user: one(user, {
		fields: [companyAccount.ownerUserId],
		references: [user.id]
	}),
	accountGrossProfits: many(accountGrossProfits),
}));

export const apiKeyRelations = relations(apiKey, ({one}) => ({
	user: one(user, {
		fields: [apiKey.userId],
		references: [user.id]
	}),
}));

export const commentAttachmentsRelations = relations(commentAttachments, ({one}) => ({
	comment: one(comments, {
		fields: [commentAttachments.commentId],
		references: [comments.id]
	}),
}));

export const accountHooksRelations = relations(accountHooks, ({one}) => ({
	companyAccount: one(companyAccount, {
		fields: [accountHooks.companyAccountId],
		references: [companyAccount.id]
	}),
}));

export const accountRisksRelations = relations(accountRisks, ({one}) => ({
	companyAccount: one(companyAccount, {
		fields: [accountRisks.companyAccountId],
		references: [companyAccount.id]
	}),
}));

export const companyContactRelations = relations(companyContact, ({one}) => ({
	company: one(company, {
		fields: [companyContact.companyId],
		references: [company.id]
	}),
}));

export const accountTargetForecastsRelations = relations(accountTargetForecasts, ({one}) => ({
	companyAccount: one(companyAccount, {
		fields: [accountTargetForecasts.companyAccountId],
		references: [companyAccount.id]
	}),
}));

export const accountUpsellingOpportunitiesRelations = relations(accountUpsellingOpportunities, ({one}) => ({
	companyAccount: one(companyAccount, {
		fields: [accountUpsellingOpportunities.companyAccountId],
		references: [companyAccount.id]
	}),
}));

export const companyRevenueRelations = relations(companyRevenue, ({one}) => ({
	company: one(company, {
		fields: [companyRevenue.companyId],
		references: [company.id]
	}),
}));

export const accountGrossProfitsRelations = relations(accountGrossProfits, ({one}) => ({
	companyAccount: one(companyAccount, {
		fields: [accountGrossProfits.companyAccountId],
		references: [companyAccount.id]
	}),
}));

export const todoResponsibleUsersRelations = relations(todoResponsibleUsers, ({one}) => ({
	todo: one(todos, {
		fields: [todoResponsibleUsers.todoId],
		references: [todos.id]
	}),
	user: one(user, {
		fields: [todoResponsibleUsers.userId],
		references: [user.id]
	}),
}));

export const commentReadsRelations = relations(commentReads, ({one}) => ({
	comment: one(comments, {
		fields: [commentReads.commentId],
		references: [comments.id]
	}),
	user: one(user, {
		fields: [commentReads.userId],
		references: [user.id]
	}),
}));