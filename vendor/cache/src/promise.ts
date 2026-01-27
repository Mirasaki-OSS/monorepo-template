export type PromiseGenerator<T> = () => Promise<T>;

export class PromiseCache<T> {
	private cache: Promise<T> | null = null;
	private expirationTime: number | null = null;

	constructor(private maxAge: number) {}

	async get(generator: PromiseGenerator<T>): Promise<T> {
		const now = Date.now();

		if (
			this.cache &&
			(!this.expirationTime ||
				(this.expirationTime && now < this.expirationTime))
		) {
			return this.cache;
		}

		this.cache = (async () => {
			try {
				const result = await generator();
				this.expirationTime = Date.now() + this.maxAge;
				setTimeout(() => this.clear(), this.maxAge);
				return result;
			} catch (error) {
				this.clear();
				throw error;
			}
		})();

		return this.cache;
	}

	clear(): void {
		this.cache = null;
		this.expirationTime = null;
	}
}
