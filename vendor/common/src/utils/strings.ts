type StringifyArrayOptions<T> = {
	maxItems: number;
	maxItemLength?: number;
	maxTotalLength?: number;
	stringify: (item: T) => string;
	prefix?: string;
	suffix?: string;
	joinString?: string;
};

/**
 * Truncate a string to a maximum length, adding a suffix if truncated
 * @param input - String to truncate
 * @param length - Maximum length
 * @param suffix - Suffix to add (default: "...")
 * @returns Truncated string
 * @example truncate("Hello World", 8) // "Hello..."
 */
const truncate = (input: string, length: number, suffix = '...'): string =>
	input.length > length
		? input.slice(0, length - suffix.length) + suffix
		: input;

/**
 * Capitalize the first letter of a string
 * @param input - String to capitalize
 * @returns Capitalized string
 * @example capitalize("hello world") // "Hello world"
 */
const capitalize = (input: string): string =>
	input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();

/**
 * Capitalize the first letter of each word
 * @param input - String to capitalize
 * @returns String with each word capitalized
 * @example capitalizeWords("hello world") // "Hello World"
 */
const capitalizeWords = (input: string): string =>
	input
		.split(' ')
		.map((word) => capitalize(word))
		.join(' ');

/**
 * Create a URL-friendly slug from a string
 * @param input - String to slugify
 * @returns Slugified string
 * @example slugify("Hello World!") // "hello-world"
 */
const slugify = (input: string): string =>
	input
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');

/**
 * Escape HTML special characters
 * @param input - String to escape
 * @returns Escaped string
 * @example escapeHtml("<div>Hello</div>") // "&lt;div&gt;Hello&lt;/div&gt;"
 */
const escapeHtml = (input: string): string =>
	input
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');

/**
 * Unescape HTML entities
 * @param input - String to unescape
 * @returns Unescaped string
 * @example unescapeHtml("&lt;div&gt;") // "<div>"
 */
const unescapeHtml = (input: string): string =>
	input
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#039;/g, "'");

/**
 * Reverse a string
 * @param input - String to reverse
 * @returns Reversed string
 * @example reverse("hello") // "olleh"
 */
const reverse = (input: string): string => input.split('').reverse().join('');

/**
 * Count occurrences of a substring
 * @param input - String to search in
 * @param search - Substring to count
 * @param caseSensitive - Whether to be case sensitive (default: true)
 * @returns Number of occurrences
 * @example countOccurrences("hello hello world", "hello") // 2
 */
const countOccurrences = (
	input: string,
	search: string,
	caseSensitive = true
): number => {
	if (!search) return 0;
	const str = caseSensitive ? input : input.toLowerCase();
	const searchStr = caseSensitive ? search : search.toLowerCase();
	return (str.match(new RegExp(searchStr, 'g')) || []).length;
};

/**
 * Check if a string contains only letters
 * @param input - String to check
 * @returns True if only letters
 * @example isAlpha("hello") // true, isAlpha("hello123") // false
 */
const isAlpha = (input: string): boolean => /^[a-zA-Z]+$/.test(input);

/**
 * Check if a string contains only alphanumeric characters
 * @param input - String to check
 * @returns True if alphanumeric
 * @example isAlphanumeric("hello123") // true, isAlphanumeric("hello-123") // false
 */
const isAlphanumeric = (input: string): boolean => /^[a-zA-Z0-9]+$/.test(input);

/**
 * Pad a string to a certain length with a character
 * @param input - String to pad
 * @param length - Target length
 * @param char - Character to pad with (default: " ")
 * @param direction - Direction to pad ("left", "right", or "both")
 * @returns Padded string
 * @example pad("hello", 10, "*", "right") // "hello*****"
 */
const pad = (
	input: string,
	length: number,
	char = ' ',
	direction: 'left' | 'right' | 'both' = 'right'
): string => {
	if (input.length >= length) return input;
	const padLength = length - input.length;

	if (direction === 'left') {
		return char.repeat(padLength) + input;
	} else if (direction === 'right') {
		return input + char.repeat(padLength);
	} else {
		const leftPad = Math.floor(padLength / 2);
		const rightPad = padLength - leftPad;
		return char.repeat(leftPad) + input + char.repeat(rightPad);
	}
};

/**
 * Stringify an array with various formatting options
 * @param arr - Array to stringify
 * @param options - Formatting options (max items, max length, etc.)
 * @returns Object with result string and truncation info
 * @example stringifyArray([1, 2, 3], {maxItems: 2, stringify: String}) // {result: "1, 2", truncatedItems: 1}
 */
const stringifyArray = <T>(
	arr: T[],
	options: StringifyArrayOptions<T>
): {
	result: string;
	truncatedItems: number;
} => {
	const {
		prefix = '',
		suffix = '',
		maxItemLength,
		maxTotalLength,
		joinString = ', ',
		maxItems,
		stringify,
	} = options;
	const reservedLength = prefix.length + suffix.length;

	const withOptions = (_arr: string[]) =>
		prefix + _arr.join(joinString) + suffix;

	const processArray = (
		_arr: T[]
	): {
		result: string[];
		truncatedItems: number;
	} => {
		const processItem = (item: T) => {
			const itemStr = stringify(item);

			if (
				typeof maxItemLength === 'undefined' ||
				itemStr.length <= maxItemLength
			) {
				return itemStr;
			}

			return truncate(itemStr, maxItemLength);
		};

		if (typeof maxTotalLength === 'undefined')
			return {
				result: _arr.map(processItem),
				truncatedItems: 0,
			};

		let totalLength = 0;
		const result: string[] = [];

		for (const item of _arr) {
			const itemStr = processItem(item);

			totalLength += itemStr.length;

			if (totalLength > maxTotalLength - reservedLength) break;

			result.push(itemStr);
		}

		return {
			result,
			truncatedItems: _arr.length - result.length,
		};
	};

	const processed = processArray(arr.slice(0, maxItems));

	return {
		result: withOptions(processed.result),
		truncatedItems: processed.truncatedItems,
	};
};

/**
 * Display array as string with formatting and optional truncation message
 * @param arr - Array to display
 * @param options - Display options
 * @returns Formatted string
 */
const displayArray = <T>(
	arr: T[],
	options: StringifyArrayOptions<T> & {
		emptyOutput: string;
	}
): string => {
	if (arr.length === 0) return options.emptyOutput;

	const { result, truncatedItems } = stringifyArray(arr, options);

	return `${result}${
		truncatedItems > 0 ? `\n...and ${truncatedItems} more...` : ''
	}`;
};

/**
 * Convert a word to plural form (simple English pluralization)
 * @param input - Word to pluralize
 * @param count - Count to determine if plural is needed
 * @returns Pluralized word
 * @example pluralize("cat", 2) // "cats", pluralize("cat", 1) // "cat"
 */
const pluralize = (input: string, count: number): string =>
	count === 1 ? input : `${input}s`;

/**
 * Convert string to snake_case
 * @param input - String to convert
 * @returns snake_case string
 * @example snakeCase("helloWorld") // "hello_world"
 */
const snakeCase = (input: string): string =>
	input
		.replace(/\s+/g, '_')
		.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`)
		.replace(/^_/, '')
		.toLowerCase();

/**
 * Convert string to Title Case
 * @param input - String to convert
 * @returns Title Case string
 * @example titleCase("hello world") // "Hello World"
 */
const titleCase = (input: string): string =>
	input
		.split(' ')
		.map((word) => capitalize(word))
		.join(' ');

/**
 * Convert string to kebab-case
 * @param input - String to convert
 * @returns kebab-case string
 * @example kebabCase("helloWorld") // "hello-world"
 */
const kebabCase = (input: string): string =>
	input
		.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
		?.join('-')
		.toLowerCase() ?? input;

/**
 * Convert string to camelCase
 * @param input - String to convert
 * @returns camelCase string
 * @example camelCase("hello world") // "helloWorld"
 */
const camelCase = (input: string): string =>
	input
		.toLowerCase()
		.split(/\s+|-/)
		.reduce(
			(s, c, i) => s + (i === 0 ? c : c.charAt(0).toUpperCase() + c.slice(1))
		);

/**
 * Convert string to PascalCase
 * @param input - String to convert
 * @returns PascalCase string
 * @example pascalCase("hello world") // "HelloWorld"
 */
const pascalCase = (input: string): string =>
	input.replace(
		/(\w)(\w*)/g,
		(_g0, g1, g2) => `${g1.toUpperCase()}${g2.toLowerCase()}`
	);

/**
 * Split a string on uppercase letters
 * @param input - String to split
 * @param splitChar - Character to insert (default: " ")
 * @returns Split string
 * @example splitOnUppercase("helloWorld") // "hello World"
 */
const splitOnUppercase = (input: string, splitChar = ' '): string =>
	input.split(/(?=[A-Z])/).join(splitChar);

/**
 * Replace template tags in a string with custom delimiters
 * @param input - String with template tags
 * @param placeholders - Object with key-value pairs
 * @param delimiters - Opening and closing delimiters (default: ["{", "}"])
 * @returns String with replaced tags
 * @example replaceTags("Hello {name}!", {name: "World"}) // "Hello World!"
 * @example replaceTags("Hello {{name}}!", {name: "World"}, ["{{", "}}"])
 * @example replaceTags("Hello [name]!", {name: "World"}, ["[", "]"])
 */
const replaceTags = (
	input: string,
	placeholders: Record<string, string>,
	delimiters: [string, string] = ['{', '}']
): string => {
	const [open, close] = delimiters;

	// Escape special regex characters
	const escapeRegex = (str: string) =>
		str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const escapedOpen = escapeRegex(open);
	const escapedClose = escapeRegex(close);

	return Object.entries(placeholders).reduce(
		(str, [key, value]) =>
			str.replace(
				new RegExp(`${escapedOpen}${key}${escapedClose}`, 'g'),
				value
			),
		input
	);
};

/**
 * Check if a string is a valid URL
 * @param input - String to check
 * @returns True if valid URL
 * @example isUrl("https://example.com") // true
 */
const isUrl = (input: string): boolean => {
	try {
		new URL(input);
		return true;
	} catch {
		return false;
	}
};

export {
	truncate,
	capitalize,
	capitalizeWords,
	slugify,
	escapeHtml,
	unescapeHtml,
	reverse,
	countOccurrences,
	isAlpha,
	isAlphanumeric,
	pad,
	stringifyArray,
	displayArray,
	pluralize,
	snakeCase,
	titleCase,
	kebabCase,
	camelCase,
	pascalCase,
	splitOnUppercase,
	replaceTags,
	isUrl,
	type StringifyArrayOptions,
};
