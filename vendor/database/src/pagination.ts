import z from 'zod/v4';

const defaultPaginationOptions = {
	page: 1,
	pageSize: 10,
} as const;

const paginationOptionsSchema = z.union([
	z.undefined(),
	z
		.object({
			page: z.coerce
				.number()
				.int()
				.min(1)
				.default(defaultPaginationOptions.page),
			pageSize: z.coerce
				.number()
				.int()
				.min(1)
				.max(100)
				.default(defaultPaginationOptions.pageSize),
		})
		.partial(),
]);

type PaginationOptionsSchema = z.infer<typeof paginationOptionsSchema>;

type LimitOffsetCapable<TReturn> = {
	limit: (limit: number) => {
		offset: (offset: number) => TReturn;
	};
};

/**
 * Applies `limit` and `offset` pagination to any query builder that supports both methods.
 *
 * For Drizzle query builders, the query should be in dynamic mode (`.$dynamic()`)
 * so pagination can be composed safely across helpers.
 *
 * @param qb - A query builder with `limit` and `offset` methods.
 * @param options - Pagination options.
 * @param options.page - 1-based page number. Defaults to `1`.
 * @param options.pageSize - Number of rows per page. Defaults to `10`.
 * @returns The same query builder with `limit` and `offset` applied.
 *
 * @example
 * ```ts
 * const query = db
 *   .select()
 *   .from(users)
 *   .where(eq(users.isActive, true));
 *
 * withPagination(query, { page: 1 }); // ❌ Type error - the query builder is not in dynamic mode
 *
 * const dynamicQuery = query.$dynamic();
 * withPagination(dynamicQuery, { page: 2, pageSize: 10 }); // ✅ OK
 * // Applies: limit(10), offset(10)
 * ```
 */
function withPagination<TReturn, T extends LimitOffsetCapable<TReturn>>(
	qb: T,
	{
		page = defaultPaginationOptions.page,
		pageSize = defaultPaginationOptions.pageSize,
	}: PaginationOptionsSchema = {}
): TReturn {
	return qb.limit(pageSize).offset((page - 1) * pageSize);
}

export {
	defaultPaginationOptions,
	type LimitOffsetCapable,
	type PaginationOptionsSchema,
	paginationOptionsSchema,
	withPagination,
};
