type StringifyArrayOptions<T> = {
	maxItems: number;
	maxItemLength?: number;
	maxTotalLength?: number;
	stringify: (item: T) => string;
	prefix?: string;
	suffix?: string;
	joinString?: string;
};

const truncate = (input: string, length: number, suffix = '...'): string =>
	input.length > length
		? input.slice(0, length - suffix.length) + suffix
		: input;

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

const pluralize = (input: string, count: number): string =>
	count === 1 ? input : `${input}s`;

const snakeCase = (input: string): string =>
	input
		.replace(/\s+/g, '_')
		.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`)
		.replace(/^_/, '')
		.toLowerCase();

const titleCase = (input: string): string =>
	input
		.toLowerCase()
		.split(' ')
		.map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
		.join(' ');

const kebabCase = (input: string): string =>
	input
		.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
		?.join('-')
		.toLowerCase() ?? input;

const camelCase = (input: string): string =>
	input
		.toLowerCase()
		.split(/\s+|-/)
		.reduce(
			(s, c, i) => s + (i === 0 ? c : c.charAt(0).toUpperCase() + c.slice(1))
		);

const pascalCase = (input: string): string =>
	input.replace(
		/(\w)(\w*)/g,
		(_g0, g1, g2) => `${g1.toUpperCase()}${g2.toLowerCase()}`
	);

const splitOnUppercase = (input: string, splitChar = ' '): string =>
	input.split(/(?=[A-Z])/).join(splitChar);

const replaceTags = (
	input: string,
	placeholders: Record<string, string>
): string =>
	Object.entries(placeholders).reduce(
		(str, [key, value]) => str.replace(new RegExp(`{${key}}`, 'g'), value),
		input
	);

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
