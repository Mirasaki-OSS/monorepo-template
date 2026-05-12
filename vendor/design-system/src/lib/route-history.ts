const DEFAULT_MAX_HISTORY_LENGTH = 50;
const DEFAULT_STORAGE_KEY = 'route-history';

export function pushRoute(
	pathname: string,
	key = DEFAULT_STORAGE_KEY,
	limit = DEFAULT_MAX_HISTORY_LENGTH
) {
	const existing = sessionStorage.getItem(key);

	const history: string[] = existing ? JSON.parse(existing) : [];

	if (history[history.length - 1] !== pathname) {
		history.push(pathname);
	}

	if (history.length > limit) {
		history.shift();
	}

	sessionStorage.setItem(key, JSON.stringify(history));
}

export function findPreviousRoute(
	excludePrefix?: string,
	key = DEFAULT_STORAGE_KEY
): string | undefined {
	const existing = sessionStorage.getItem(key);

	if (!existing) return undefined;

	const history: string[] = JSON.parse(existing);

	for (let i = history.length - 2; i >= 0; i--) {
		const path = history[i];

		if (!path) continue;

		if (!excludePrefix || !path.startsWith(excludePrefix)) {
			return path;
		}
	}

	return undefined;
}
