import { apiKey as apiKeyPlugin } from '@better-auth/api-key';
import { createAuth } from '@md-oss/auth/server';
import { TimeMagic } from '@md-oss/common/constants/time';
import { slugify } from '@md-oss/common/utils/strings';
import { createDb } from '@md-oss/db';
import * as schema from '@md-oss/db/schema/auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { captcha as captchaPlugin } from 'better-auth/plugins';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod/v4';
import { serverEnv } from '../env';
import { activeSocialProviders, buildSocialProviders } from './providers';

const parsedEnv = serverEnv();

const apiUrl = new URL(parsedEnv.NEXT_PUBLIC_API_URL);
const appUrl = new URL(parsedEnv.NEXT_PUBLIC_APP_URL);

const useCrossSubDomainCookies =
	parsedEnv.NODE_ENV === 'production'
		? apiUrl.origin !== appUrl.origin
		: apiUrl.hostname !== appUrl.hostname;

const plugins = [
	apiKeyPlugin({}),
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

export const auth = createAuth({
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
		cookiePrefix: `${slugify(parsedEnv.NEXT_PUBLIC_APP_NAME)}-auth`,
		useSecureCookies: true,
		crossSubDomainCookies: {
			enabled: useCrossSubDomainCookies,
			domain: parsedEnv.NEXT_PUBLIC_APP_URL,
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
			sameSite: useCrossSubDomainCookies ? 'none' : 'lax',
			secure: true,
			httpOnly: true,
			domain: useCrossSubDomainCookies
				? parsedEnv.NEXT_PUBLIC_APP_URL
				: undefined,
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
					console.log('Before creating user:', user, context);
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
			async sendChangeEmailConfirmation(data, request) {
				console.log('Send change email confirmation to:', data);
			},
		},
		deleteUser: {
			enabled: true,
			async beforeDelete(user, request) {
				console.log('Before deleting user:', user);
			},
			async afterDelete(user, request) {
				console.log('After deleting user:', user);
			},
			async sendDeleteAccountVerification(data, request) {
				console.log('Send delete account verification to:', data);
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
		// Start Emails
		async onExistingUserSignUp(data, request) {
			console.log('Existing user attempted to sign up:', data);
		},
		async onPasswordReset(data, request) {
			console.log('Password reset requested for user:', data);
		},
		async sendResetPassword(data, request) {
			console.log('Send reset password email to:', data);
		},
	},
	emailVerification: {
		sendOnSignIn: false,
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		async beforeEmailVerification(user, request) {
			console.log('Before email verification for user:', user);
		},
		async afterEmailVerification(user, request) {
			console.log('After email verification for user:', user);
		},
		async sendVerificationEmail(data, request) {
			console.log('Send verification email to:', data);
		},
	},
	plugins,
});

export type Auth = typeof auth;
