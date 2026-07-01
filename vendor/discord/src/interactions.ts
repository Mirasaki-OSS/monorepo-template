export const COMPONENT_SEPARATOR = '|';

export const resolveComponentSeparator = (identifier: string): string => {
	return identifier.includes(COMPONENT_SEPARATOR)
		? identifier.split(COMPONENT_SEPARATOR)[0] || ''
		: identifier;
};
