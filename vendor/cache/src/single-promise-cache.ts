import type { PromiseLoader } from './types';

/**
 * Caches one async computation result for a fixed amount of time.
 */
export class SinglePromiseCache<T> {
	private cachedPromise: Promise<T> | null = null;
	private expiresAt: number | null = null;

	constructor(private readonly ttlMs: number) {}

	async getOrLoad(loader: PromiseLoader<T>): Promise<T> {
		const now = Date.now();

		if (this.cachedPromise && (!this.expiresAt || now < this.expiresAt)) {
			return this.cachedPromise;
		}

		this.cachedPromise = (async () => {
			try {
				const result = await loader();
				this.expiresAt = Date.now() + this.ttlMs;
				setTimeout(() => this.clear(), this.ttlMs);
				return result;
			} catch (error) {
				this.clear();
				throw error;
			}
		})();

		return this.cachedPromise;
	}

	clear(): void {
		this.cachedPromise = null;
		this.expiresAt = null;
	}
}

export class PromiseCache<T> extends SinglePromiseCache<T> {}
