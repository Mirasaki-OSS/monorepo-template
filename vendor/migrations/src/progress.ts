import type { MigrationLogger } from './types';

/**
 * Progress tracker for long-running migrations
 */
export class MigrationProgress {
	private processed = 0;
	private lastLoggedPercent = 0;
	private startTime = Date.now();

	constructor(
		private logger: MigrationLogger,
		private total: number,
		private logInterval = 10 // Log every 10% by default
	) {
		this.logger.info(
			`Starting processing of ${this.formatNumber(total)} items`
		);
	}

	/**
	 * Increment progress by one
	 */
	increment(): void {
		this.processed++;
		this.checkAndLog();
	}

	/**
	 * Increment progress by a specific amount
	 */
	add(amount: number): void {
		this.processed += amount;
		this.checkAndLog();
	}

	/**
	 * Set current progress to a specific value
	 */
	set(value: number): void {
		this.processed = value;
		this.checkAndLog();
	}

	/**
	 * Get current progress percentage
	 */
	getPercent(): number {
		return this.total === 0
			? 100
			: Math.floor((this.processed / this.total) * 100);
	}

	/**
	 * Get elapsed time in milliseconds
	 */
	getElapsed(): number {
		return Date.now() - this.startTime;
	}

	/**
	 * Get estimated time remaining in milliseconds
	 */
	getETA(): number {
		if (this.processed === 0) return 0;

		const elapsed = this.getElapsed();
		const rate = this.processed / elapsed;
		const remaining = this.total - this.processed;

		return remaining / rate;
	}

	/**
	 * Complete the progress tracking
	 */
	complete(): void {
		this.processed = this.total;
		const elapsed = this.getElapsed();
		const rate = this.total / (elapsed / 1000);

		this.logger.info(
			`Completed processing ${this.formatNumber(this.total)} items in ${this.formatDuration(elapsed)}`,
			{
				total: this.total,
				duration: elapsed,
				rate: `${rate.toFixed(2)} items/sec`,
			}
		);
	}

	/**
	 * Check if we should log progress and do so
	 */
	private checkAndLog(): void {
		const currentPercent = this.getPercent();

		// Log at intervals or when complete
		if (
			currentPercent >= this.lastLoggedPercent + this.logInterval ||
			this.processed === this.total
		) {
			this.logProgress();
			this.lastLoggedPercent = currentPercent;
		}
	}

	/**
	 * Log current progress
	 */
	private logProgress(): void {
		const percent = this.getPercent();
		const elapsed = this.getElapsed();
		const eta = this.getETA();

		const progressBar = this.createProgressBar(percent);

		this.logger.info(
			`Progress: ${progressBar} ${percent}% (${this.formatNumber(this.processed)}/${this.formatNumber(this.total)})`,
			{
				elapsed: this.formatDuration(elapsed),
				eta: this.formatDuration(eta),
			}
		);
	}

	/**
	 * Create a visual progress bar
	 */
	private createProgressBar(percent: number, width = 20): string {
		const filled = Math.floor((percent / 100) * width);
		const empty = width - filled;

		return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`;
	}

	/**
	 * Format a number with thousands separators
	 */
	private formatNumber(num: number): string {
		return num.toLocaleString();
	}

	/**
	 * Format duration in milliseconds to human-readable string
	 */
	private formatDuration(ms: number): string {
		if (ms < 1000) return `${Math.round(ms)}ms`;
		if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
		if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
		return `${(ms / 3600000).toFixed(1)}h`;
	}
}
