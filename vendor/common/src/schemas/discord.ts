import z from 'zod/v4';

const discordSnowflakeSchema = z.string().regex(/^\d{17,19}$/);

type DiscordSnowflake = z.infer<typeof discordSnowflakeSchema>;

const discordWebhookPathRegex = /^\/api\/webhooks\/\d{17,19}\/[\w-]+$/;

const allowedDiscordWebhookHosts = new Set([
	'discord.com',
	'discordapp.com',
	'ptb.discord.com',
	'ptb.discordapp.com',
	'canary.discord.com',
	'canary.discordapp.com',
]);

const discordWebhookUrlSchema = z.url().transform((value, ctx) => {
	const url = new URL(value);

	if (url.protocol !== 'https:') {
		ctx.issues.push({
			code: 'custom',
			input: value,
			message: 'Discord webhook URL must use https.',
		});
		return z.NEVER;
	}

	if (!allowedDiscordWebhookHosts.has(url.hostname)) {
		ctx.issues.push({
			code: 'custom',
			input: value,
			message: 'Discord webhook URL host is not supported.',
		});
		return z.NEVER;
	}

	if (!discordWebhookPathRegex.test(url.pathname)) {
		ctx.issues.push({
			code: 'custom',
			input: value,
			message: 'Discord webhook URL path is invalid.',
		});
		return z.NEVER;
	}

	return `https://discord.com${url.pathname}`;
});

type DiscordWebhookUrl = z.infer<typeof discordWebhookUrlSchema>;

export {
	allowedDiscordWebhookHosts,
	type DiscordSnowflake,
	type DiscordWebhookUrl,
	discordSnowflakeSchema,
	discordWebhookPathRegex,
	discordWebhookUrlSchema,
};
