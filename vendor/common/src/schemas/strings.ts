import { z } from 'zod/v4';

// Prevents unicode, emojis, Zalgo, etc.
const PRINTABLE_ASCII_REGEX =
	/^[a-zA-Z0-9 <>[\]{}()!@#$%^&*+=._\-:,;'"?/\\|~`]+$/;

// At least one alphanumeric character (blocks >>>>, !!!, etc.)
const REQUIRES_ALPHANUMERIC_REGEX = /[a-zA-Z0-9]/;

const normalizeString = (value: string): string =>
	value.trim().replace(/\s+/g, ' ');

const normalizedString = () =>
	z
		.string()
		.refine(normalizeString)
		.refine(
			(value) => PRINTABLE_ASCII_REGEX.test(value),
			'Contains invalid characters'
		)
		.refine(
			(value) => REQUIRES_ALPHANUMERIC_REGEX.test(value),
			'Must contain at least one letter or number'
		);

export {
	normalizedString,
	normalizeString,
	PRINTABLE_ASCII_REGEX,
	REQUIRES_ALPHANUMERIC_REGEX,
};
