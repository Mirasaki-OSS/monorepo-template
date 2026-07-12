import { z } from 'zod/v4';

export const updateUserInputSchema = z
	.object({
		name: z.string().trim().min(1).max(30).optional(),
		image: z.url().nullable().optional(),
		displayUsername: z.string().trim().min(1).max(64).nullable().optional(),
		bio: z.string().trim().max(280).nullable().optional(),
	})
	.refine((input) => Object.keys(input).length > 0, {
		message: 'At least one field must be provided',
	});

export const deleteUserInputSchema = z.object({
	confirm: z.literal('DELETE'),
});

export const deleteUserOutputSchema = z.object({
	deletedUserId: z.string(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserInputSchema>;
export type DeleteUserOutput = z.infer<typeof deleteUserOutputSchema>;
