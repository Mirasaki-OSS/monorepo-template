const DEFAULT_CURRENCY = 'EUR';
const DEFAULT_LOCALE = 'en-US';
const DEFAULT_NULL_DISPLAY = 'N/A' as const;

const SAFE_FALLBACK_FRACTION_DIGITS = 2;

const DATE_FORMATTER = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
});

type FormatCurrencyOptions = {
	currency?: string | null;
	locale?: string;
	minimumFractionDigits?: number;
	maximumFractionDigits?: number;
};

type FormatDateRelativeOptions = {
	maxParts?: number;
};

type FormatIntervalOptions = {
	nullDisplay?: string;
	prefix?: string;
};

type RelativeTimeUnit = {
	label: string;
	seconds: number;
	isApproximate?: boolean;
};

const RELATIVE_TIME_UNITS: readonly RelativeTimeUnit[] = [
	{ label: 'year', seconds: 365 * 24 * 60 * 60, isApproximate: true },
	{ label: 'month', seconds: 30 * 24 * 60 * 60, isApproximate: true },
	{ label: 'week', seconds: 7 * 24 * 60 * 60 },
	{ label: 'day', seconds: 24 * 60 * 60 },
	{ label: 'hour', seconds: 60 * 60 },
	{ label: 'minute', seconds: 60 },
	{ label: 'second', seconds: 1 },
];

const toDate = (value: string | Date) =>
	typeof value === 'string' ? new Date(value) : value;

const isValidDate = (value: Date) => !Number.isNaN(value.getTime());

const formatRelativeUnit = (value: number, label: string) =>
	`${value} ${label}${value === 1 ? '' : 's'}`;

const normalizeCurrencyCode = (currency?: string | null) =>
	currency?.trim().toUpperCase() || DEFAULT_CURRENCY;

const getCurrencyFractionDigits = (
	currency: string,
	locale = DEFAULT_LOCALE
): number => {
	try {
		return (
			new Intl.NumberFormat(locale, {
				style: 'currency',
				currency,
			}).resolvedOptions().maximumFractionDigits ??
			SAFE_FALLBACK_FRACTION_DIGITS
		);
	} catch {
		return SAFE_FALLBACK_FRACTION_DIGITS;
	}
};

const formatCurrencyAmount = (
	amount: number | null,
	options: FormatCurrencyOptions = {}
) => {
	if (amount === null) {
		return 'N/A';
	}

	const currency = normalizeCurrencyCode(options.currency);
	const locale = options.locale ?? DEFAULT_LOCALE;

	try {
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency,
			minimumFractionDigits: options.minimumFractionDigits,
			maximumFractionDigits: options.maximumFractionDigits,
		}).format(amount);
	} catch {
		const fractionDigits =
			options.maximumFractionDigits ??
			options.minimumFractionDigits ??
			SAFE_FALLBACK_FRACTION_DIGITS;
		return `${amount.toFixed(fractionDigits)} ${currency}`;
	}
};

const formatPrice = (
	amountInMinorUnits: number | null,
	options: FormatCurrencyOptions = {}
) => {
	if (amountInMinorUnits === null) {
		return 'N/A';
	}

	const currency = normalizeCurrencyCode(options.currency);
	const locale = options.locale ?? DEFAULT_LOCALE;
	const fractionDigits = getCurrencyFractionDigits(currency, locale);
	const divisor = 10 ** fractionDigits;

	return formatCurrencyAmount(amountInMinorUnits / divisor, {
		...options,
		currency,
		locale,
	});
};

const formatInterval = (
	interval: string | null | undefined,
	intervalCount = 1,
	options: FormatIntervalOptions = {}
) => {
	const nullDisplay = options.nullDisplay ?? DEFAULT_NULL_DISPLAY;
	if (!interval) {
		return nullDisplay;
	}

	const normalizedInterval = interval.trim().toLowerCase();
	if (!normalizedInterval) {
		return nullDisplay;
	}

	const safeIntervalCount = Math.max(1, Math.floor(intervalCount));
	const prefix = options.prefix ?? 'Every';

	if (safeIntervalCount === 1) {
		return `${prefix} ${normalizedInterval}`;
	}

	return `${prefix} ${safeIntervalCount} ${normalizedInterval}s`;
};

function formatDate(date: string | Date): string;
function formatDate(date: null): typeof DEFAULT_NULL_DISPLAY;
function formatDate<TDisplayNull extends string>(
	date: null,
	displayNull: TDisplayNull
): TDisplayNull;
function formatDate<TDisplayNull extends string = typeof DEFAULT_NULL_DISPLAY>(
	date: string | Date | null,
	displayNull?: TDisplayNull
): string;
function formatDate<TDisplayNull extends string = typeof DEFAULT_NULL_DISPLAY>(
	date: string | Date | null,
	displayNull?: TDisplayNull
): string {
	const nullDisplay = displayNull ?? (DEFAULT_NULL_DISPLAY as TDisplayNull);

	if (date === null) {
		return nullDisplay;
	}

	const dateObj = toDate(date);
	if (!isValidDate(dateObj)) {
		return nullDisplay;
	}

	return DATE_FORMATTER.format(dateObj);
}

const formatDateRelative = (
	date: string | Date | null,
	options: FormatDateRelativeOptions = {}
) => {
	if (date === null) {
		return DEFAULT_NULL_DISPLAY;
	}

	const dateObj = toDate(date);

	if (!isValidDate(dateObj)) {
		return DEFAULT_NULL_DISPLAY;
	}

	const now = new Date();
	const diffMs = now.getTime() - dateObj.getTime();
	const isFuture = diffMs < 0;
	let remainingSeconds = Math.floor(Math.abs(diffMs) / 1000);

	const normalizedMaxParts = Math.max(1, Math.floor(options.maxParts ?? 2));

	const parts: string[] = [];

	let isApproximate = false;

	for (const unit of RELATIVE_TIME_UNITS) {
		if (parts.length >= normalizedMaxParts) {
			break;
		}

		const value = Math.floor(remainingSeconds / unit.seconds);
		if (value <= 0) {
			continue;
		}

		if (unit.isApproximate) {
			isApproximate = true;
		}

		parts.push(formatRelativeUnit(value, unit.label));
		remainingSeconds -= value * unit.seconds;
	}

	if (parts.length === 0) {
		parts.push(formatRelativeUnit(0, 'second'));
	}

	const relativeText = parts.join(', ');
	return isFuture
		? `in${isApproximate ? ' about' : ''} ${relativeText}`
		: `${isApproximate ? 'about ' : ''}${relativeText} ago`;
};

export type {
	FormatCurrencyOptions,
	FormatDateRelativeOptions,
	FormatIntervalOptions,
};
export {
	DEFAULT_CURRENCY,
	DEFAULT_LOCALE,
	DEFAULT_NULL_DISPLAY,
	formatCurrencyAmount,
	formatDate,
	formatDateRelative,
	formatInterval,
	formatPrice,
	getCurrencyFractionDigits,
	normalizeCurrencyCode,
};
