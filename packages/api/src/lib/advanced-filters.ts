import { and, eq, ilike, or, sql } from '@md-oss/db';
import { z } from 'zod/v4';

export const advancedFilterOperators = [
	'iLike',
	'notILike',
	'eq',
	'ne',
	'inArray',
	'notInArray',
	'isEmpty',
	'isNotEmpty',
	'lt',
	'lte',
	'gt',
	'gte',
	'isBetween',
	'isRelativeToToday',
] as const;

export const advancedFilterVariants = [
	'text',
	'number',
	'range',
	'date',
	'dateRange',
	'boolean',
	'select',
	'multiSelect',
] as const;

export const advancedFilterJoinOperators = ['and', 'or'] as const;

type SqlExpression = ReturnType<typeof sql>;
type ComparableSubject = Parameters<typeof eq>[0];

function combineClauses(joinOperator: 'and' | 'or', clauses: SqlExpression[]) {
	return joinOperator === 'or' ? or(...clauses) : and(...clauses);
}

export function createAdvancedFilterSchemas<
	const TIds extends readonly [string, ...string[]],
>(config: { ids: TIds }) {
	const idSchema = z.enum(config.ids);
	const operatorSchema = z.enum(advancedFilterOperators);
	const variantSchema = z.enum(advancedFilterVariants);
	const joinOperatorSchema = z.enum(advancedFilterJoinOperators).default('and');

	const itemSchema = z.object({
		id: idSchema,
		value: z.union([z.string(), z.array(z.string())]).default(''),
		variant: variantSchema,
		operator: operatorSchema,
		filterId: z.string().min(1),
	});

	return {
		idSchema,
		operatorSchema,
		variantSchema,
		joinOperatorSchema,
		itemSchema,
	};
}

export type AdvancedFilterItem = {
	id: string;
	value: string | string[];
	variant: string;
	operator: string;
	filterId: string;
};

export type AdvancedFilterFieldConfig =
	| {
			kind: 'text';
			column: ComparableSubject;
			emptyClause?: SqlExpression;
			notEmptyClause?: SqlExpression;
	  }
	| {
			kind: 'compositeText';
			columns: readonly ComparableSubject[];
			emptyClause?: SqlExpression;
			notEmptyClause?: SqlExpression;
			positiveCombine?: 'and' | 'or';
			negativeCombine?: 'and' | 'or';
	  }
	| {
			kind: 'date';
			column: ComparableSubject;
			emptyClause?: SqlExpression;
			notEmptyClause?: SqlExpression;
	  }
	| {
			kind: 'mapped';
			getClauseForValue: (value: string) => SqlExpression | undefined;
			emptyClause?: SqlExpression;
			notEmptyClause?: SqlExpression;
			positiveCombine?: 'and' | 'or';
			negativeCombine?: 'and' | 'or';
	  };

function parseDateValue(value: string) {
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function buildTextClause({
	column,
	operator,
	value,
	emptyClause,
	notEmptyClause,
}: {
	column: ComparableSubject;
	operator: string;
	value: string;
	emptyClause?: SqlExpression;
	notEmptyClause?: SqlExpression;
}) {
	const normalizedValue = value.trim();

	if (
		operator !== 'isEmpty' &&
		operator !== 'isNotEmpty' &&
		normalizedValue === ''
	) {
		return undefined;
	}

	switch (operator) {
		case 'iLike':
			return ilike(column, `%${normalizedValue}%`);
		case 'notILike':
			return sql`not (${ilike(column, `%${normalizedValue}%`)})`;
		case 'eq':
			return eq(column, normalizedValue);
		case 'ne':
			return sql`${column} <> ${normalizedValue}`;
		case 'isEmpty':
			return emptyClause ?? sql`${column} is null or ${column} = ''`;
		case 'isNotEmpty':
			return notEmptyClause ?? sql`${column} is not null and ${column} <> ''`;
		default:
			return undefined;
	}
}

export function buildCompositeTextClause({
	columns,
	operator,
	value,
	emptyClause,
	notEmptyClause,
	positiveCombine = 'or',
	negativeCombine = 'and',
}: {
	columns: readonly ComparableSubject[];
	operator: string;
	value: string;
	emptyClause?: SqlExpression;
	notEmptyClause?: SqlExpression;
	positiveCombine?: 'and' | 'or';
	negativeCombine?: 'and' | 'or';
}) {
	const normalizedValue = value.trim();

	if (operator === 'isEmpty') {
		return emptyClause;
	}

	if (operator === 'isNotEmpty') {
		return notEmptyClause;
	}

	if (normalizedValue === '') {
		return undefined;
	}

	const clauses = columns
		.map((column) =>
			buildTextClause({ column, operator, value: normalizedValue })
		)
		.filter((clause): clause is SqlExpression => clause !== undefined);

	if (clauses.length === 0) {
		return undefined;
	}

	return operator === 'notILike' || operator === 'ne'
		? combineClauses(negativeCombine, clauses)
		: combineClauses(positiveCombine, clauses);
}

export function buildDateClause({
	column,
	operator,
	value,
	emptyClause,
	notEmptyClause,
}: {
	column: ComparableSubject;
	operator: string;
	value: string | string[];
	emptyClause?: SqlExpression;
	notEmptyClause?: SqlExpression;
}) {
	if (operator === 'isEmpty') {
		return emptyClause ?? sql`${column} is null`;
	}

	if (operator === 'isNotEmpty') {
		return notEmptyClause ?? sql`${column} is not null`;
	}

	const values = Array.isArray(value) ? value : [value];

	if (operator === 'isBetween') {
		const start = parseDateValue(values[0] ?? '');
		const end = parseDateValue(values[1] ?? '');

		if (!start || !end) {
			return undefined;
		}

		return and(sql`${column} >= ${start}`, sql`${column} <= ${end}`);
	}

	const comparableValue = values[0] ?? '';
	const parsedDate = parseDateValue(comparableValue);

	if (!parsedDate) {
		return undefined;
	}

	switch (operator) {
		case 'eq':
			return sql`${column} = ${parsedDate}`;
		case 'ne':
			return sql`${column} <> ${parsedDate}`;
		case 'lt':
			return sql`${column} < ${parsedDate}`;
		case 'lte':
			return sql`${column} <= ${parsedDate}`;
		case 'gt':
			return sql`${column} > ${parsedDate}`;
		case 'gte':
			return sql`${column} >= ${parsedDate}`;
		default:
			return undefined;
	}
}

export function buildMappedValueClause({
	values,
	operator,
	getClauseForValue,
	emptyClause,
	notEmptyClause,
	positiveCombine = 'or',
	negativeCombine = 'and',
}: {
	values: string | string[];
	operator: string;
	getClauseForValue: (value: string) => SqlExpression | undefined;
	emptyClause?: SqlExpression;
	notEmptyClause?: SqlExpression;
	positiveCombine?: 'and' | 'or';
	negativeCombine?: 'and' | 'or';
}) {
	if (operator === 'isEmpty') {
		return emptyClause;
	}

	if (operator === 'isNotEmpty') {
		return notEmptyClause;
	}

	const valueArray = Array.isArray(values) ? values : [values];
	const clauses = valueArray
		.map((value) => getClauseForValue(value))
		.filter((clause): clause is SqlExpression => clause !== undefined);

	if (clauses.length === 0) {
		return undefined;
	}

	if (operator === 'eq' || operator === 'inArray') {
		return combineClauses(positiveCombine, clauses);
	}

	if (operator === 'ne' || operator === 'notInArray') {
		return combineClauses(
			negativeCombine,
			clauses.map((clause) => sql`not (${clause})`)
		);
	}

	return undefined;
}

export function buildAdvancedFilterClauses<TFilter extends AdvancedFilterItem>(
	filters: readonly TFilter[],
	joinOperator: 'and' | 'or',
	getClause: (filter: TFilter) => SqlExpression | undefined
) {
	const clauses = filters
		.map((filter) => getClause(filter))
		.filter((clause): clause is SqlExpression => clause !== undefined);

	if (clauses.length === 0) {
		return undefined;
	}

	return combineClauses(joinOperator, clauses);
}

export function buildAdvancedFilterClauseFromRegistry<
	TFilter extends AdvancedFilterItem,
>(
	filter: TFilter,
	fieldConfig: Record<string, AdvancedFilterFieldConfig | undefined>
) {
	const config = fieldConfig[filter.id];
	if (!config) {
		return undefined;
	}

	if (config.kind === 'text') {
		return buildTextClause({
			column: config.column,
			operator: filter.operator,
			value: Array.isArray(filter.value)
				? (filter.value[0] ?? '')
				: filter.value,
			emptyClause: config.emptyClause,
			notEmptyClause: config.notEmptyClause,
		});
	}

	if (config.kind === 'compositeText') {
		return buildCompositeTextClause({
			columns: config.columns,
			operator: filter.operator,
			value: Array.isArray(filter.value)
				? (filter.value[0] ?? '')
				: filter.value,
			emptyClause: config.emptyClause,
			notEmptyClause: config.notEmptyClause,
			positiveCombine: config.positiveCombine,
			negativeCombine: config.negativeCombine,
		});
	}

	if (config.kind === 'date') {
		return buildDateClause({
			column: config.column,
			operator: filter.operator,
			value: filter.value,
			emptyClause: config.emptyClause,
			notEmptyClause: config.notEmptyClause,
		});
	}

	return buildMappedValueClause({
		values: filter.value,
		operator: filter.operator,
		getClauseForValue: config.getClauseForValue,
		emptyClause: config.emptyClause,
		notEmptyClause: config.notEmptyClause,
		positiveCombine: config.positiveCombine,
		negativeCombine: config.negativeCombine,
	});
}
