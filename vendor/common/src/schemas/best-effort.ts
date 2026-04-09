import z from 'zod/v4';

const bestEffortStringSchema = z
	.union([z.string(), z.number(), z.boolean()])
	.transform((value) => String(value))
	.catch('');

const bestEffortNullableStringSchema = z
	.union([z.string(), z.number(), z.boolean(), z.null()])
	.transform((value) => {
		if (value === null) return null;

		const stringValue = String(value);
		return stringValue.trim() === '' ? null : stringValue;
	})
	.catch(null);

const bestEffortBooleanSchema = z
	.union([z.boolean(), z.number(), z.string()])
	.transform((value) => {
		if (typeof value === 'boolean') return value;
		if (typeof value === 'number') return value !== 0;

		const normalized = value.trim().toLowerCase();

		if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
		if (['false', '0', 'no', 'n', 'off', ''].includes(normalized)) return false;

		return false;
	})
	.catch(false);

const bestEffortRequiredStringSchema = bestEffortStringSchema.pipe(
	z.string().trim().min(1, 'Required')
);

const bestEffortRequiredNullableStringSchema =
	bestEffortNullableStringSchema.pipe(
		z.string().trim().min(1, 'Required').nullable()
	);

const bestEffortRequiredBooleanSchema = z
	.union([z.boolean(), z.number(), z.string()])
	.transform((value) => {
		if (typeof value === 'boolean') return value;
		if (typeof value === 'number') return value !== 0;

		const normalized = value.trim().toLowerCase();

		if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
		if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;

		throw new Error('Invalid boolean value');
	});

type BestEffortString = z.infer<typeof bestEffortStringSchema>;
type BestEffortNullableString = z.infer<typeof bestEffortNullableStringSchema>;
type BestEffortBoolean = z.infer<typeof bestEffortBooleanSchema>;
type BestEffortRequiredString = z.infer<typeof bestEffortRequiredStringSchema>;
type BestEffortRequiredNullableString = z.infer<
	typeof bestEffortRequiredNullableStringSchema
>;
type BestEffortRequiredBoolean = z.infer<
	typeof bestEffortRequiredBooleanSchema
>;

export {
	type BestEffortBoolean,
	type BestEffortNullableString,
	type BestEffortRequiredBoolean,
	type BestEffortRequiredNullableString,
	type BestEffortRequiredString,
	type BestEffortString,
	bestEffortBooleanSchema,
	bestEffortNullableStringSchema,
	bestEffortRequiredBooleanSchema,
	bestEffortRequiredNullableStringSchema,
	bestEffortRequiredStringSchema,
	bestEffortStringSchema,
};
