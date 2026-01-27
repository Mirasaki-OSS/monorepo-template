const randomInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min: number, max: number): number =>
	Math.random() * (max - min) + min;

const randomItem = <T>(items: T[]): T | undefined =>
	items[Math.floor(Math.random() * items.length)];

const randomKey = <T>(items: Record<string, T> | T[]): string | undefined =>
	randomItem(Object.keys(items));

const randomValue = <T>(items: Record<string, T> | T[]): T | undefined =>
	randomItem(Array.isArray(items) ? items : Object.values(items));

const randomBoolean = (): boolean => Math.random() < 0.5;

const randomString = (
	length: number,
	characters?: string | RandomStringOptions
): string => {
	const resolveCharactersFromOptions = (options: RandomStringOptions) => {
		return [
			options.useUppercase ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
			options.useLowercase ? 'abcdefghijklmnopqrstuvwxyz' : '',
			options.useNumeric ? '0123456789' : '',
		].join('');
	};

	const resolvedCharacters =
		typeof characters === 'string'
			? characters
			: resolveCharactersFromOptions(characters ?? {});

	return Array.from({ length })
		.map(() =>
			resolvedCharacters.charAt(randomInt(0, resolvedCharacters.length - 1))
		)
		.join('');
};

type RandomStringOptions = {
	useNumeric?: boolean;
	useLowercase?: boolean;
	useUppercase?: boolean;
};

export {
	randomInt,
	randomFloat,
	randomItem,
	randomKey,
	randomValue,
	randomBoolean,
	randomString,
	type RandomStringOptions,
};
