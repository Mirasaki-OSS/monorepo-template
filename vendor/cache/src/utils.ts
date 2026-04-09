/**
 * Stringify function that produces consistent output for the same input, regardless of key order in objects. Useful for generating cache keys based on object content.
 */
export const stableSerializeForCacheKey = (value: unknown): string => {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value);
	}

	if (Array.isArray(value)) {
		return `[${value.map((item) => stableSerializeForCacheKey(item)).join(',')}]`;
	}

	const entries = Object.entries(value as Record<string, unknown>).sort(
		([keyA], [keyB]) => keyA.localeCompare(keyB)
	);

	return `{${entries
		.map(
			([key, item]) =>
				`${JSON.stringify(key)}:${stableSerializeForCacheKey(item)}`
		)
		.join(',')}}`;
};
