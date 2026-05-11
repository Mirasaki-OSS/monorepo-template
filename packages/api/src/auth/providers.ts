import type { BetterAuthOptions } from 'better-auth';
import type { ServerEnv } from '../env';

export type SocialProviders = NonNullable<BetterAuthOptions['socialProviders']>;

export type SocialProviderIdentifier = keyof SocialProviders;

export const activeSocialProviders: SocialProviderIdentifier[] = [
	'discord',
	'google',
	'github',
];

export const buildSocialProviders = (parsedEnv: ServerEnv): SocialProviders => {
	const providers: SocialProviders = {};

	if (parsedEnv.DISCORD_CLIENT_ID && parsedEnv.DISCORD_CLIENT_SECRET) {
		providers.discord = {
			enabled: true,
			clientId: parsedEnv.DISCORD_CLIENT_ID,
			clientSecret: parsedEnv.DISCORD_CLIENT_SECRET,
			disableDefaultScope: false, // Note: Enabling this will require explicit consent (no longer auto-approved)
			scope: ['identify', 'email'], // Note: Defining custom scopes will require explicit consent (no longer auto-approved)
			prompt: 'none', // Note: Setting "consent" will require explicit consent (no longer auto-approved)
			permissions: 0,
			disableIdTokenSignIn: false,
			disableImplicitSignUp: false,
			overrideUserInfoOnSignIn: true,
			disableSignUp: false,
			responseMode: 'form_post',
			redirectURI: `${parsedEnv.NEXT_PUBLIC_API_URL}/api/auth/callback/discord`,
			// async getUserInfo(token) {
			// 	return token;
			// },
			// async mapProfileToUser(profile) {
			// 	return profile;
			// },
			// async refreshAccessToken(refreshToken) {
			// 	return refreshToken;
			// },
			// async verifyIdToken(token, nonce) {
			// 	return token;
			// },
		};
	}

	if (parsedEnv.GOOGLE_CLIENT_ID && parsedEnv.GOOGLE_CLIENT_SECRET) {
		providers.google = {
			enabled: true,
			clientId: parsedEnv.GOOGLE_CLIENT_ID,
			clientSecret: parsedEnv.GOOGLE_CLIENT_SECRET,
			redirectURI: `${parsedEnv.NEXT_PUBLIC_API_URL}/api/auth/callback/google`,
			overrideUserInfoOnSignIn: true,
		};
	}

	if (parsedEnv.GITHUB_CLIENT_ID && parsedEnv.GITHUB_CLIENT_SECRET) {
		providers.github = {
			enabled: true,
			clientId: parsedEnv.GITHUB_CLIENT_ID,
			clientSecret: parsedEnv.GITHUB_CLIENT_SECRET,
			redirectURI: `${parsedEnv.NEXT_PUBLIC_API_URL}/api/auth/callback/github`,
			overrideUserInfoOnSignIn: true,
		};
	}

	return providers;
};

export const extractSocialProviders = (
	providers: SocialProviders
): SocialProviderIdentifier[] => {
	return Object.keys(providers) as SocialProviderIdentifier[];
};

export const resolveSocialProviders = (): SocialProviderIdentifier[] => {
	const providers: SocialProviderIdentifier[] = [];

	if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
		providers.push('discord');
	}

	if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
		providers.push('google');
	}

	if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
		providers.push('github');
	}

	return providers;
};
