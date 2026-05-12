import { apiKey as apiKeyPlugin } from '@better-auth/api-key';
import { passkey as passkeyPlugin } from '@better-auth/passkey';
import { createAuth } from '@md-oss/auth/server';
import { TimeMagic } from '@md-oss/common/constants/time';
import { slugify } from '@md-oss/common/utils/strings';
import { createDb } from '@md-oss/db';
import * as schema from '@md-oss/db/schema/auth';
import { emailService } from '@md-oss/email';
import type { BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import {
	captcha as captchaPlugin,
	magicLink as magicLinkPlugin,
	username as usernamePlugin,
} from 'better-auth/plugins';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod/v4';
import { serverEnv } from '../env';
import { activeSocialProviders, buildSocialProviders } from './providers';

const parsedEnv = serverEnv();
const appPrefix = slugify(parsedEnv.NEXT_PUBLIC_APP_NAME);
const appInitials = appPrefix
	.split('-')
	.map((part) => part[0])
	.join('');

const apiUrl = new URL(parsedEnv.NEXT_PUBLIC_API_URL);
const appUrl = new URL(parsedEnv.NEXT_PUBLIC_APP_URL);

const useCrossSubDomainCookies = apiUrl.hostname !== appUrl.hostname;

const plugins = [
	usernamePlugin({
		minUsernameLength: 3,
		maxUsernameLength: 32,
		usernameNormalization(username) {
			return username.trim().toLowerCase();
		},
	}),
	passkeyPlugin({
		origin: appUrl.origin,
		rpName: parsedEnv.NEXT_PUBLIC_APP_NAME,
		rpID: apiUrl.hostname,
		registration: {
			requireSession: true,
		},
	}),
	magicLinkPlugin({
		async sendMagicLink(data) {
			await emailService.sendMagicLinkEmail(
				{
					to: {
						email: data.email,
						name: null,
					},
				},
				data
			);
		},
		allowedAttempts: 1,
		disableSignUp: false,
		expiresIn: TimeMagic.SECONDS_PER_MINUTE * 15,
		storeToken: 'hashed',
		rateLimit: {
			max: 5,
			window: TimeMagic.SECONDS_PER_MINUTE,
		},
	}),
	apiKeyPlugin({
		apiKeyHeaders: ['x-api-key'],
		configId: 'default',
		defaultKeyLength: 64,
		defaultPrefix: `${appInitials.toUpperCase()}-`,
		deferUpdates: false,
		disableKeyHashing: false,
		enableMetadata: true,
		enableSessionForAPIKeys: false,
		fallbackToDatabase: false,
		minimumNameLength: 3,
		maximumNameLength: 32,
		minimumPrefixLength: 3,
		maximumPrefixLength: 16,
		rateLimit: {
			enabled: true,
			maxRequests: 100,
			timeWindow: TimeMagic.MILLISECONDS_PER_MINUTE,
		},
		requireName: true,
		startingCharactersConfig: {
			shouldStore: true,
			charactersLength: 6,
		},
	}),
	...(parsedEnv.CLOUDFLARE_TURNSTILE_SECRET_KEY
		? [
				captchaPlugin({
					provider: 'cloudflare-turnstile',
					secretKey: parsedEnv.CLOUDFLARE_TURNSTILE_SECRET_KEY,
					endpoints: [
						'/sign-up/email',
						'/sign-in/email',
						'/sign-in/username',
						'/request-password-reset',
					],
				}),
			]
		: []),
];

const config = {
	appName: parsedEnv.NEXT_PUBLIC_APP_NAME,
	basePath: '/api/auth',
	database: drizzleAdapter(createDb(), {
		provider: 'pg',
		schema: schema,
	}),
	trustedOrigins: [parsedEnv.CORS_ORIGIN],
	secret: parsedEnv.BETTER_AUTH_SECRET,
	baseURL: parsedEnv.NEXT_PUBLIC_API_URL,
	advanced: {
		cookiePrefix: `${appPrefix}-auth`,
		useSecureCookies: parsedEnv.NODE_ENV === 'production',
		crossSubDomainCookies: {
			enabled: useCrossSubDomainCookies,
		},
		database: {
			generateId: () => uuidv7(),
			defaultFindManyLimit: 100,
		},
		skipTrailingSlashes: false,
		trustedProxyHeaders: false,
		ipAddress: {
			disableIpTracking: false,
			ipAddressHeaders: ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'],
			ipv6Subnet: 64,
		},
		defaultCookieAttributes: {
			sameSite: 'lax',
			secure: parsedEnv.NODE_ENV === 'production',
			httpOnly: true,
			maxAge: TimeMagic.SECONDS_PER_DAY * 7,
		},
	},
	// Start opt-in functionality
	socialProviders: buildSocialProviders(parsedEnv),
	account: {
		accountLinking: {
			enabled: true,
			allowDifferentEmails: true,
			allowUnlinkingAll: true,
			disableImplicitLinking: false,
			trustedProviders: activeSocialProviders,
			updateUserInfoOnLink: true,
		},
		encryptOAuthTokens: true,
		skipStateCookieCheck: false,
		storeAccountCookie: false,
		storeStateStrategy: 'database',
		updateAccountOnSignIn: true,
	},
	session: {
		freshAge: 60 * 60 * 24, // 1 day
		cookieCache: {
			enabled: false,
		},
		deferSessionRefresh: true,
		disableSessionRefresh: false,
		preserveSessionInDatabase: false,
		storeSessionInDatabase: true,
	},
	telemetry: {
		enabled: false,
	},
	databaseHooks: {
		user: {
			create: {
				async before(user, context) {
					// [DEV] Init admin, transform role
					console.debug('Before creating user:', user, context);
				},
			},
		},
	},
	rateLimit: {
		enabled: true,
		storage: 'memory',
	},
	experimental: {
		joins: false,
	},
	secrets: [
		{
			value: parsedEnv.BETTER_AUTH_SECRET,
			version: 1,
		},
	],
	logger: {
		disabled: false,
	},
	onAPIError: {
		throw: true,
		onError(error, ctx) {
			console.error('Auth API Error:', error, ctx);
		},
	},
	user: {
		changeEmail: {
			enabled: true,
			updateEmailWithoutVerification: false,
			async sendChangeEmailConfirmation(data) {
				await emailService.sendEmailChangeVerificationEmail(
					{
						to: {
							email: data.user.email,
							name: data.user.name || data.user.email,
						},
					},
					data
				);
			},
		},
		deleteUser: {
			enabled: true,
			async sendDeleteAccountVerification(data) {
				await emailService.sendDeleteAccountVerificationEmail(
					{
						to: {
							email: data.user.email,
							name: data.user.name || data.user.email,
						},
					},
					data
				);
			},
		},
		additionalFields: {
			bio: {
				type: 'string',
				fieldName: 'bio',
				required: false,
				validator: {
					input: z.string().max(160, {
						error: 'Bio must be 160 characters or less',
					}),
				},
			},
		},
	},
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
		minPasswordLength: 8,
		maxPasswordLength: 128,
		requireEmailVerification: false,
		disableSignUp: false,
		revokeSessionsOnPasswordReset: true,
		async sendResetPassword(data) {
			await emailService.sendResetPasswordEmail(
				{
					to: {
						email: data.user.email,
						name: data.user.name || data.user.email,
					},
				},
				data
			);
		},
	},
	emailVerification: {
		sendOnSignIn: false,
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		async sendVerificationEmail(data) {
			await emailService.sendEmailVerificationEmail(
				{
					to: {
						email: data.user.email,
						name: data.user.name || data.user.email,
					},
				},
				data
			);
		},
	},
	plugins,
} as const satisfies BetterAuthOptions;

export type Auth = ReturnType<typeof createAuth<typeof config>>;

export const auth: Auth = createAuth(config);

/**
 * Re-exports symbols that appear in the inferred type of `createAuth` (`betterAuth`) so declaration emit
 * (TS2883 / “cannot be named without a reference …”) can serialize `.d.ts` output for this package.
 *
 * **Temporary:** remove when better-auth’s (plugins) published types no longer force consumers to
 * anchor these names (see issues below).
 *
 * @see https://github.com/better-auth/better-auth/issues/4250
 * @see https://github.com/better-auth/better-auth/issues/8623
 */
export type { PublicKeyCredentialCreationOptionsJSON } from '@better-auth/passkey/client';
