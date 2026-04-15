import { useCallback, useEffect, useRef, useState } from 'react';

type PersistedStateEnvelope<T> = {
	updatedAt: number;
	value: T;
	version: number;
};

type SetPersistentStateAction<T> = T | ((currentState: T) => T);

type UsePersistentStateOptions<T> = {
	storageKey: string;
	initialValue: T;
	enabled?: boolean;
	maxAgeMs?: number;
	version?: number;
	callbacks?: {
		onLoad?: (state: T) => void;
		onUpdate?: (state: T) => void;
		onStorageCleanupError?: (error: unknown) => void;
		onStorageWriteError?: (error: unknown) => void;
	};
};

type PersistentStateControls = {
	clear: () => void;
	hydrated: boolean;
	reset: () => void;
};

type PersistentStateMeta = {
	controls: PersistentStateControls;
	currentStateIsInitial: boolean;
};

type UsePersistentStateReturn<T> = readonly [
	T,
	(value: SetPersistentStateAction<T>) => void,
	PersistentStateMeta,
];

const DEFAULT_PERSISTED_STATE_VERSION = 1;

const canUseLocalStorage = () =>
	typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const resolveNextState = <T>(
	value: SetPersistentStateAction<T>,
	currentState: T
): T =>
	typeof value === 'function'
		? (value as (currentState: T) => T)(currentState)
		: value;

function usePersistentState<T>({
	storageKey,
	initialValue,
	enabled = true,
	maxAgeMs,
	version = DEFAULT_PERSISTED_STATE_VERSION,
	callbacks = {},
}: UsePersistentStateOptions<T>): UsePersistentStateReturn<T> {
	const initialValueRef = useRef(initialValue);
	const [state, setState] = useState(initialValue);
	const [hydrated, setHydrated] = useState(false);
	const [hasChanged, setHasChanged] = useState(false);

	useEffect(() => {
		initialValueRef.current = initialValue;
	}, [initialValue]);

	useEffect(() => {
		if (!enabled || !canUseLocalStorage()) {
			setState(initialValue);
			setHydrated(true);
			return;
		}

		try {
			const rawValue = window.localStorage.getItem(storageKey);

			if (!rawValue) {
				setState(initialValue);
				return;
			}

			const parsedValue = JSON.parse(rawValue) as Partial<
				PersistedStateEnvelope<T>
			>;
			const hasExpired =
				typeof maxAgeMs === 'number' &&
				typeof parsedValue.updatedAt === 'number' &&
				Date.now() - parsedValue.updatedAt > maxAgeMs;

			if (parsedValue.version !== version || hasExpired) {
				window.localStorage.removeItem(storageKey);
				setState(initialValue);
				return;
			}

			if ('value' in parsedValue && parsedValue.value !== undefined) {
				const castedValue = parsedValue.value as T;
				setState(castedValue);
				if (callbacks.onLoad) {
					callbacks.onLoad(castedValue);
				}
				return;
			}

			setState(initialValue);
		} catch {
			try {
				window.localStorage.removeItem(storageKey);
			} catch (err) {
				if (callbacks.onStorageCleanupError) {
					callbacks.onStorageCleanupError(err);
				}
			}

			setState(initialValue);
		} finally {
			setHydrated(true);
		}
	}, [enabled, initialValue, maxAgeMs, storageKey, version, callbacks]);

	useEffect(() => {
		if (!enabled || !hydrated || !canUseLocalStorage()) {
			return;
		}

		try {
			const envelope: PersistedStateEnvelope<T> = {
				updatedAt: Date.now(),
				value: state,
				version,
			};

			window.localStorage.setItem(storageKey, JSON.stringify(envelope));
		} catch (err) {
			if (callbacks.onStorageWriteError) {
				callbacks.onStorageWriteError(err);
			}
		}
	}, [enabled, hydrated, state, storageKey, version, callbacks]);

	const updateState = useCallback(
		(value: SetPersistentStateAction<T>) => {
			setState((currentState) => {
				const nextState = resolveNextState(value, currentState);
				if (nextState !== currentState) {
					setHasChanged(true);
					if (callbacks.onUpdate) {
						callbacks.onUpdate(nextState);
					}
				}
				return nextState;
			});
		},
		[callbacks]
	);

	const clear = useCallback(() => {
		if (!canUseLocalStorage()) {
			return;
		}

		try {
			window.localStorage.removeItem(storageKey);
		} catch (err) {
			if (callbacks.onStorageCleanupError) {
				callbacks.onStorageCleanupError(err);
			}
		}
	}, [storageKey, callbacks]);

	const reset = useCallback(() => {
		setState(initialValueRef.current);
		setHasChanged(false);
		clear();
	}, [clear]);

	return [
		state,
		updateState,
		{
			controls: { clear, hydrated, reset },
			currentStateIsInitial: !hasChanged,
		},
	] as const;
}

export {
	type PersistedStateEnvelope,
	type PersistentStateMeta,
	type SetPersistentStateAction,
	type UsePersistentStateOptions,
	type UsePersistentStateReturn,
	usePersistentState,
};
