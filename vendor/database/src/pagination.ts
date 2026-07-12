import z from 'zod/v4';

const defaultPaginationOptions = {
	page: 1,
	pageSize: 10,
} as const;

const paginationOptionsSchema = z.object({
	page: z.coerce.number().int().min(1).default(defaultPaginationOptions.page),
	pageSize: z.coerce
		.number()
		.int()
		.min(1)
		.max(100)
		.default(defaultPaginationOptions.pageSize),
});

const paginationInputSchema = z.union([
	z.undefined(),
	paginationOptionsSchema.partial(),
]);

const paginationOutputObjectSchema = z.object({
	totalCount: z.number().int().nonnegative(),
	pageCount: z.number().int().nonnegative(),
	page: z.number().int().min(1),
	pageSize: z.number().int().min(1).max(100),
});

const paginationOutputSchema = <T extends z.ZodTypeAny>(itemsSchema: T) =>
	z.object({
		items: z.array(itemsSchema),
		pagination: paginationOutputObjectSchema,
	});

type PaginationOptionsSchema = z.infer<typeof paginationOptionsSchema>;

type PaginationInputSchema = z.infer<typeof paginationInputSchema>;

type PaginationOutputObjectSchema = z.infer<
	typeof paginationOutputObjectSchema
>;

type PaginationOutputSchema<T extends z.ZodTypeAny> = z.infer<
	ReturnType<typeof paginationOutputSchema<T>>
>;

/**
 * Collects an authorization-filtered page from an offset-paginated source while
 * preserving accurate page metadata for the filtered result set.
 *
 * Useful when the backing query cannot express per-row access rules directly in
 * SQL and the caller needs a dense page plus accurate `totalCount` / `pageCount`.
 */
async function collectFilteredPaginationPage<T>(
	fetchPage: (page: number, pageSize: number) => Promise<{ items: T[] }>,
	filter: (item: T) => boolean,
	options: {
		page: number;
		pageSize: number;
		batchPageSize?: number;
	}
): Promise<{ items: T[]; pagination: PaginationOutputObjectSchema }> {
	const {
		page,
		pageSize,
		batchPageSize = Math.max(pageSize * 2, 50),
	} = options;
	const filteredOffset = (page - 1) * pageSize;
	const items: T[] = [];
	let totalCount = 0;
	let batchPage = 1;

	while (true) {
		const batch = await fetchPage(batchPage, batchPageSize);

		for (const item of batch.items) {
			if (!filter(item)) {
				continue;
			}

			if (totalCount >= filteredOffset && items.length < pageSize) {
				items.push(item);
			}

			totalCount += 1;
		}

		if (batch.items.length < batchPageSize) {
			break;
		}

		batchPage += 1;
	}

	return {
		items,
		pagination: {
			totalCount,
			pageCount: Math.max(1, Math.ceil(totalCount / pageSize)),
			page,
			pageSize,
		},
	};
}

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
	}: PaginationOptionsSchema = {
		page: defaultPaginationOptions.page,
		pageSize: defaultPaginationOptions.pageSize,
	}
): TReturn {
	return qb.limit(pageSize).offset((page - 1) * pageSize);
}

export {
	collectFilteredPaginationPage,
	defaultPaginationOptions,
	type LimitOffsetCapable,
	type PaginationInputSchema,
	type PaginationOptionsSchema,
	type PaginationOutputObjectSchema,
	type PaginationOutputSchema,
	paginationInputSchema,
	paginationOptionsSchema,
	paginationOutputObjectSchema,
	paginationOutputSchema,
	withPagination,
};
