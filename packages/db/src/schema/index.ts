import { authRelations } from './auth';

const relations = {
	...authRelations,
};

export * from './auth';
export * from './metadata';
export { relations };
