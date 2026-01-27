import { Mutex } from 'async-mutex';

class MutexManager {
	private readonly mutexMap = new Map<string, Mutex>();
	private readonly cleanupTimers = new Map<string, NodeJS.Timeout>();
	private readonly ttl: number;

	constructor(ttl: number) {
		this.ttl = ttl;
	}

	private cleanup(key: string) {
		this.mutexMap.delete(key);
		const timer = this.cleanupTimers.get(key);
		if (timer) {
			clearTimeout(timer);
			this.cleanupTimers.delete(key);
		}
	}

	private resetCleanupTimer(key: string) {
		const existingTimer = this.cleanupTimers.get(key);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		const timer = setTimeout(() => {
			this.cleanup(key);
		}, this.ttl);

		this.cleanupTimers.set(key, timer);
	}

	private normalizeKey(key: string | Record<string, string>): string {
		if (typeof key === 'string') return key;

		return `mutex-${Object.entries(key)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, v]) => `${k}-${v}`)
			.join('-')}`;
	}

	public getMutex(key: string | Record<string, string>): Mutex {
		const normalizedKey = this.normalizeKey(key);

		if (!this.mutexMap.has(normalizedKey)) {
			this.mutexMap.set(normalizedKey, new Mutex());
		}

		this.resetCleanupTimer(normalizedKey);

		return this.mutexMap.get(normalizedKey) as Mutex;
	}

	public async runExclusive<T>(
		key: string | Record<string, string>,
		fn: () => Promise<T>
	): Promise<T> {
		const mutex = this.getMutex(key);
		return mutex.runExclusive(fn);
	}

	public async waitIfLocked(
		key: string | Record<string, string>
	): Promise<void> {
		const mutex = this.getMutex(key);
		if (mutex.isLocked()) {
			await mutex.waitForUnlock();
		}
	}
}

export { MutexManager };
