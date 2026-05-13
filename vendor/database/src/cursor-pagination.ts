import z from 'zod/v4';

const defaultCursorPaginationOptions = {
	limit: 10,
	cursor: null,
	query: null,
} as const;

const cursorPaginationOptionsSchema = z.object({
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(100)
		.default(defaultCursorPaginationOptions.limit),
	cursor: z.coerce
		.string()
		.min(1)
		.nullable()
		.default(defaultCursorPaginationOptions.cursor),
	query: z.coerce
		.string()
		.trim()
		.min(1)
		.max(100)
		.nullable()
		.default(defaultCursorPaginationOptions.query),
});

const cursorPaginationInputSchema = z.union([
	z.undefined(),
	cursorPaginationOptionsSchema.partial(),
]);

const cursorPaginationOutputSchema = <T extends z.ZodTypeAny>(itemsSchema: T) =>
	z.object({
		items: z.array(itemsSchema),
		nextCursor: z.string().nullable(),
	});

type CursorPaginationOptionsSchema = z.infer<
	typeof cursorPaginationOptionsSchema
>;

type CursorPaginationInputSchema = z.infer<typeof cursorPaginationInputSchema>;

type CursorPaginationOutputSchema<T extends z.ZodTypeAny> = z.infer<
	ReturnType<typeof cursorPaginationOutputSchema<T>>
>;

/**
 * Collects items across multiple cursor-paginated pages until a target count is reached,
 * applying a filter function to each batch.
 *
 * Useful for pagination with post-fetch filtering (e.g., authorization checks).
 * Automatically fetches additional pages to account for filtered-out items.
 *
 * @param fetchBatch - Async function that fetches a page of items. Called with (cursor, limit).
 * @param filter - Predicate function to determine which items to keep.
 * @param getCursor - Function to extract the cursor value from an item.
 * @param options - Pagination options: limit (required), cursor (optional).
 * @returns Paginated results with items and nextCursor pointing to the last returned item.
 *
 * @example
 * ```ts
 * const result = await collectFilteredCursorPage(
 *   (cursor, limit) => fetchUserBatch({ cursor, limit }),
 *   (user) => user.isActive,
 *   (user) => user.id,
 *   { limit: 10, cursor: undefined }
 * );
 * // Returns exactly 10 active users (or fewer if end of results)
 * ```
 */
async function collectFilteredCursorPage<T>(
	fetchBatch: (
		cursor: string | undefined,
		limit: number
	) => Promise<{ items: T[]; nextCursor: string | null }>,
	filter: (item: T) => boolean,
	getCursor: (item: T) => string,
	options: { limit: number; cursor?: string | null }
): Promise<{ items: T[]; nextCursor: string | null }> {
	const { limit, cursor: initialCursor } = options;
	const collected: T[] = [];
	let cursor: string | undefined = initialCursor ?? undefined;
	let hasMore = true;

	// Keep fetching batches until we have enough filtered items
	while (hasMore && collected.length < limit) {
		const batch = await fetchBatch(cursor, Math.max(limit * 2, 50));

		// Filter this batch
		const filtered = batch.items.filter(filter);
		collected.push(...filtered);

		// Prepare for next iteration
		if (batch.nextCursor) {
			cursor = batch.nextCursor;
		} else {
			hasMore = false;
		}
	}

	// Take exactly limit items
	const page = collected.slice(0, limit);

	// nextCursor points to the last item we're returning
	const lastItem = page.at(-1);
	const nextCursor =
		collected.length > limit && lastItem ? getCursor(lastItem) : null;

	return {
		items: page,
		nextCursor,
	};
}

export {
	type CursorPaginationInputSchema,
	type CursorPaginationOptionsSchema,
	type CursorPaginationOutputSchema,
	collectFilteredCursorPage,
	cursorPaginationInputSchema,
	cursorPaginationOptionsSchema,
	cursorPaginationOutputSchema,
	defaultCursorPaginationOptions,
};
