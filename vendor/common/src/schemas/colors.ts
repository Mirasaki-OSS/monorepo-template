import z from 'zod/v4';

const hexColorRegex = '^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$';
const hexColorSchema = z.string().regex(new RegExp(hexColorRegex), {
	message: 'Invalid hex color format',
});
type HexColor = z.infer<typeof hexColorSchema>;

export { type HexColor, hexColorRegex, hexColorSchema };
