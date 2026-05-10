export const createStableOrderId = (prefix = 'arr'): string =>
	`${prefix}-${Math.random().toString(36).slice(2)}`;

export const ensureStableOrderIds = (
	ids: string[],
	length: number,
	prefix = 'arr'
): string[] => {
	const next = [...ids];
	while (next.length < length) {
		next.push(createStableOrderId(prefix));
	}
	return next.slice(0, length);
};

export const appendStableOrderId = (
	ids: string[],
	prefix = 'arr'
): string[] => [...ids, createStableOrderId(prefix)];

export const removeStableOrderIdAt = (ids: string[], index: number): string[] =>
	ids.filter((_, currentIndex) => currentIndex !== index);

const moveArrayItem = <T>(items: T[], from: number, to: number): T[] => {
	if (from === to) return items;
	if (from < 0 || to < 0 || from >= items.length || to >= items.length) {
		return items;
	}

	const next = [...items];
	const [movedItem] = next.splice(from, 1);
	next.splice(to, 0, movedItem as T);
	return next;
};

export const reorderByStableIds = <T>({
	ids,
	items,
	activeId,
	overId,
}: {
	ids: string[];
	items: T[];
	activeId: string;
	overId: string;
}): { nextIds: string[]; nextItems: T[] } | null => {
	if (activeId === overId) {
		return null;
	}

	const oldIndex = ids.indexOf(activeId);
	const newIndex = ids.indexOf(overId);
	if (oldIndex === -1 || newIndex === -1) {
		return null;
	}

	return {
		nextIds: moveArrayItem(ids, oldIndex, newIndex),
		nextItems: moveArrayItem(items, oldIndex, newIndex),
	};
};
