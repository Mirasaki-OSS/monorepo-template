import z from 'zod/v4';

const hexColorRegex = '^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$';
const hexColorSchema = z.string().regex(new RegExp(hexColorRegex), {
	message: 'Invalid hex color format',
});
type HexColor = z.infer<typeof hexColorSchema>;

const hexColorToInt = (hex: string): number => {
	const normalizedHex = hex.replace(/^#/, '');
	return parseInt(normalizedHex, 16);
};

const colorIntToHex = (colorInt: number): string => {
	const hex = colorInt.toString(16).padStart(6, '0');
	return `#${hex}`;
};

export {
	colorIntToHex,
	type HexColor,
	hexColorRegex,
	hexColorSchema,
	hexColorToInt,
};
