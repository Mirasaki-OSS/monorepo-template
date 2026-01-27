import { LRUCache as _LRUCache } from 'lru-cache';

export type {
	BackgroundFetch as LRUBackgroundFetch,
	DisposeTask as LRUDisposeTask,
	Index as LRUIndex,
	NumberArray as LRUNumberArray,
	PosInt as LRUPosInt,
	Stack as LRUStack,
	StackLike as LRUStackLike,
	UintArray as LRUUintArray,
	ZeroArray as LRUZeroArray,
} from 'lru-cache';

export class LRUCache<T extends NonNullable<unknown>> extends _LRUCache<
	string,
	T,
	unknown
> {}

export type LRUArgs<T extends NonNullable<unknown>> = ConstructorParameters<
	typeof _LRUCache<string, T, unknown>
>[0];
