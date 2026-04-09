import z from 'zod/v4';

type Pagination = {
	totalItems: number;
	currentPage: number;
	itemsPerPage: number;
	totalPages: number;
	limit: number;
	offset: number;
};

const paginationQuerySchema = ({
	min = 1,
	max = 100,
	defaultLimit = 25,
}: {
	min?: number;
	max?: number;
	defaultLimit?: number;
} = {}) => {
	return z.object({
		limit: z.coerce
			.number()
			.int()
			.min(min, { message: `Limit must be at least ${min}` })
			.max(max, { message: `Limit must be at most ${max}` })
			.default(defaultLimit),
		offset: z.coerce
			.number()
			.int()
			.min(0, { message: 'Offset must be 0 or greater' })
			.default(0),
	});
};

export { type Pagination, paginationQuerySchema };
