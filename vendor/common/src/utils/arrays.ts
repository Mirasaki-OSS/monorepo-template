import { truncate } from './strings';

const chunk = <T>(arr: T[], size: number): T[][] => {
	const result = [];

	if (size <= 0) {
		throw new Error('Chunk size must be greater than 0');
	}

	for (let i = 0; i < arr.length; i += size) {
		result.push(arr.slice(i, size + i));
	}

	return result;
};

const join = <T extends unknown[]>(
	arr: T,
	options: JoinOptions = {}
): string => {
	let output: string;
	const {
		maxItems = -1,
		maxLength = -1,
		emptyOutput = 'None',
		joinString = ', ',
	} = options;

	const withMaxLength = (str: string) => {
		if (maxLength === -1) return str;
		return str.length > maxLength ? truncate(str, maxLength) : str;
	};

	if (arr.length === 0) output = emptyOutput;
	else if (arr.length <= maxItems || maxItems === -1) {
		output = arr.join(joinString);
	} else {
		const includedItems = arr.slice(0, maxItems);
		const excludedItemsCount = arr.length - maxItems;
		const excludedItemsMessage = `and ${excludedItemsCount} more...`;

		output = `${includedItems.join(joinString)}, ${excludedItemsMessage}`;
	}

	return withMaxLength(output);
};

const isStringArray = (arr: unknown[]): arr is string[] =>
	arr.every((item) => typeof item === 'string');
const isNumberArray = (arr: unknown[]): arr is number[] =>
	arr.every((item) => typeof item === 'number');
const isBooleanArray = (arr: unknown[]): arr is boolean[] =>
	arr.every((item) => typeof item === 'boolean');
const isObjectArray = (arr: unknown[]): arr is Record<string, unknown>[] =>
	arr.every((item) => typeof item === 'object' && item !== null);

type JoinOptions = {
	/**
	 * The string to join the items with
	 * @default ', '
	 */
	joinString?: string;
	/**
	 * The maximum number of (array) items to include
	 * @default -1
	 */
	maxItems?: number;
	/**
	 * The maximum length of the joined/final string
	 * @default -1
	 */
	maxLength?: number;
	/**
	 * The string that is returned if the input array is empty
	 * @default 'None'
	 */
	emptyOutput?: string;
};

export {
	chunk,
	join,
	isStringArray,
	isNumberArray,
	isBooleanArray,
	isObjectArray,
	type JoinOptions,
};
