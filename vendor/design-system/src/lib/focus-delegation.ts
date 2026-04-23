const ACTIVATION_KEYS = new Set(['Enter', ' ']);

/**
 * Creates paired onClick/onKeyDown handlers that focus a query-selected element
 * within the event's parent element, unless the actual target matches an
 * exclusion selector.
 *
 * @param query - CSS selector for the element to focus (e.g. `'input'`)
 * @param excludeSelector - CSS selector to skip focus delegation (e.g. `'button'`)
 */
export function createFocusDelegationHandlers<E extends HTMLElement>(
	query: string,
	excludeSelector: string
): Pick<React.HTMLAttributes<E>, 'onClick' | 'onKeyDown'> {
	const shouldDelegate = (target: EventTarget | null): boolean => {
		if (!(target instanceof HTMLElement)) return false;
		return !target.closest(excludeSelector);
	};

	const focusTarget = (currentTarget: E): void => {
		currentTarget.parentElement?.querySelector<HTMLElement>(query)?.focus();
	};

	return {
		onClick(e) {
			if (shouldDelegate(e.target)) focusTarget(e.currentTarget);
		},
		onKeyDown(e) {
			if (ACTIVATION_KEYS.has(e.key) && shouldDelegate(e.target)) {
				focusTarget(e.currentTarget);
			}
		},
	};
}
