// Not exported directly, local consumer files should export instead (aka. where they're relevant)

const DEFAULT_LOCALE = 'en-US';
const DEFAULT_NULL_DISPLAY = 'N/A' as const;

const DEFAULT_CURRENCY = 'EUR';
const SAFE_FALLBACK_FRACTION_DIGITS = 2;

export {
	DEFAULT_CURRENCY,
	DEFAULT_LOCALE,
	DEFAULT_NULL_DISPLAY,
	SAFE_FALLBACK_FRACTION_DIGITS,
};
