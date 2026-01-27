import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = (): Readonly<{
	NEXT_PUBLIC_GA_MEASUREMENT_ID?: string | undefined;
}> =>
	createEnv({
		client: {
			NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().startsWith('G-').optional(),
		},
		runtimeEnv: {
			NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
		},
	});
