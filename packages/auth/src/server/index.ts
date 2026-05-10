import { type BetterAuthOptions, betterAuth } from 'better-auth';

export type Auth<Options extends BetterAuthOptions = NonNullable<unknown>> =
	ReturnType<typeof betterAuth<Options>>;

export { betterAuth as createAuth };
