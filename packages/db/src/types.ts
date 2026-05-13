import type {
	accountRelations,
	authRelations,
	sessionRelations,
	userRelations,
} from './schema';
import type {
	AccountInsert,
	AccountSelect,
	SessionInsert,
	SessionSelect,
	UserInsert,
	UserSelect,
	VerificationInsert,
	VerificationSelect,
} from './zod';

// === Relation Types ===
type AuthRelations = typeof authRelations;
type UserRelations = typeof userRelations;
type AccountRelations = typeof accountRelations;
type SessionRelations = typeof sessionRelations;

export type {
	AccountInsert,
	AccountRelations,
	AccountSelect,
	AuthRelations,
	SessionInsert,
	SessionRelations,
	SessionSelect,
	UserInsert,
	UserRelations,
	UserSelect,
	VerificationInsert,
	VerificationSelect,
};
