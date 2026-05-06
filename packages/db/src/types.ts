import type {
	account,
	accountRelations,
	session,
	sessionRelations,
	user,
	userRelations,
	verification,
} from './schema';

// === Select Types ===
type AccountSelect = typeof account.$inferSelect;
type SessionSelect = typeof session.$inferSelect;
type UserSelect = typeof user.$inferSelect;
type VerificationSelect = typeof verification.$inferSelect;

// === Insert Types ===
type AccountInsert = typeof account.$inferInsert;
type SessionInsert = typeof session.$inferInsert;
type UserInsert = typeof user.$inferInsert;
type VerificationInsert = typeof verification.$inferInsert;

// === Relation Types ===
type UserRelations = typeof userRelations;
type AccountRelations = typeof accountRelations;
type SessionRelations = typeof sessionRelations;

export type {
	AccountInsert,
	AccountRelations,
	AccountSelect,
	SessionInsert,
	SessionRelations,
	SessionSelect,
	UserInsert,
	UserRelations,
	UserSelect,
	VerificationInsert,
	VerificationSelect,
};
