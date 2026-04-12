import z from 'zod/v4';
import { DiscordMagic } from '../constants';
import { type HexColor, hexColorSchema } from './colors';

/**
 * @see {@link https://discord.com/developers/docs/resources/message#embed-object-embed-types}
 */
enum EmbedType {
	/**
	 * Generic embed rendered from embed attributes
	 */
	Rich = 'rich',
	/**
	 * Image embed
	 */
	Image = 'image',
	/**
	 * Video embed
	 */
	Video = 'video',
	/**
	 * Animated gif image embed rendered as a video embed
	 */
	GIFV = 'gifv',
	/**
	 * Article embed
	 */
	Article = 'article',
	/**
	 * Link embed
	 */
	Link = 'link',
	/**
	 * Auto moderation alert embed
	 *
	 * @unstable This embed type is currently not documented by Discord, but it is returned in the auto moderation system messages.
	 */
	AutoModerationMessage = 'auto_moderation_message',
	/**
	 * Poll result embed
	 */
	PollResult = 'poll_result',
}

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

const discordEmbedColorSchema = hexColorSchema.describe(
	'Color of the Discord embed in hexadecimal format (e.g., #FF5733).'
);

const discordEmbedThumbnailSchema = z
	.object({
		url: z.url().describe('URL of the thumbnail image for the Discord embed.'),
		width: z
			.number()
			.int()
			.positive()
			.optional()
			.describe('Width of the thumbnail image in pixels.'),
		height: z
			.number()
			.int()
			.positive()
			.optional()
			.describe('Height of the thumbnail image in pixels.'),
	})
	.describe('Thumbnail information for the Discord embed.');

const discordEmbedFooterSchema = z
	.object({
		text: z
			.string()
			.describe('Footer text of the Discord embed message.')
			.max(
				DiscordMagic.EMBED_FOOTER_MAX,
				`Footer text cannot exceed ${DiscordMagic.EMBED_FOOTER_MAX} characters.`
			),
		icon_url: z
			.url()
			.optional()
			.describe('URL of the icon image for the footer.'),
	})
	.describe('Footer information for the Discord embed.');

const discordEmbedFieldSchema = z
	.object({
		name: z
			.string()
			.describe('Name of the field in the Discord embed.')
			.max(
				DiscordMagic.EMBED_FIELD_NAME_MAX,
				`Field name cannot exceed ${DiscordMagic.EMBED_FIELD_NAME_MAX} characters.`
			),
		value: z
			.string()
			.describe('Value of the field in the Discord embed.')
			.max(
				DiscordMagic.EMBED_FIELD_VALUE_MAX,
				`Field value cannot exceed ${DiscordMagic.EMBED_FIELD_VALUE_MAX} characters.`
			),
		inline: z
			.boolean()
			.optional()
			.describe('Whether the field should be displayed inline.'),
	})
	.describe('Field information for the Discord embed.');

const discordEmbedProviderSchema = z
	.object({
		name: z
			.string()
			.describe('Name of the provider for the Discord embed.')
			.max(
				DiscordMagic.EMBED_PROVIDER_MAX,
				`Provider name cannot exceed ${DiscordMagic.EMBED_PROVIDER_MAX} characters.`
			),
		url: z.url().describe('URL of the provider for the Discord embed.'),
	})
	.describe('Provider information for the Discord embed.');

const discordEmbedAuthorSchema = z
	.object({
		name: z
			.string()
			.describe('Name of the author for the Discord embed.')
			.max(
				DiscordMagic.EMBED_AUTHOR_MAX,
				`Author name cannot exceed ${DiscordMagic.EMBED_AUTHOR_MAX} characters.`
			),
		url: z
			.url()
			.optional()
			.describe('URL of the author for the Discord embed.'),
		icon_url: z
			.url()
			.optional()
			.describe('URL of the icon image for the author.'),
	})
	.describe('Author information for the Discord embed.');

const discordEmbedImageSchema = z
	.object({
		url: z.url().describe('URL of the image for the Discord embed.'),
		width: z
			.number()
			.int()
			.positive()
			.optional()
			.describe('Width of the image in pixels.'),
		height: z
			.number()
			.int()
			.positive()
			.optional()
			.describe('Height of the image in pixels.'),
	})
	.describe('Image information for the Discord embed.');

const discordEmbedSchemaBase = z.object({
	title: z
		.string()
		.max(
			DiscordMagic.EMBED_TITLE_MAX,
			`Title cannot exceed ${DiscordMagic.EMBED_TITLE_MAX} characters.`
		)
		.optional()
		.nullable()
		.describe('Title of the Discord embed message.'),
	description: z
		.string()
		.max(
			DiscordMagic.EMBED_DESCRIPTION_MAX,
			`Description cannot exceed ${DiscordMagic.EMBED_DESCRIPTION_MAX} characters.`
		)
		.optional()
		.nullable()
		.describe('Description text of the Discord embed message.'),
	color: discordEmbedColorSchema
		.optional()
		.nullable()
		.describe(
			'Color of the Discord embed in hexadecimal format (e.g., #FF5733).'
		),
	url: z.url().optional().nullable().describe('URL of the Discord embed.'),
	timestamp: z
		.string()
		.optional()
		.nullable()
		.describe('Timestamp of the Discord embed in ISO 8601 format.'),
	type: z
		.enum([
			EmbedType.Rich,
			EmbedType.Image,
			EmbedType.Video,
			EmbedType.Article,
			EmbedType.Link,
		])
		.optional()
		.default(EmbedType.Rich)
		.describe('Type of the Discord embed.'),
});

const _discordEmbedSchema = discordEmbedSchemaBase
	.extend({
		thumbnail: discordEmbedThumbnailSchema.optional(),
		footer: discordEmbedFooterSchema.optional(),
		fields: z.array(discordEmbedFieldSchema).optional(),
		provider: discordEmbedProviderSchema.optional(),
		author: discordEmbedAuthorSchema.optional(),
		image: discordEmbedImageSchema.optional(),
	})
	.describe('Schema for validating Discord embed objects.');

type DiscordEmbed = z.infer<typeof _discordEmbedSchema>;

const getTotalEmbedCharacters = (data: DiscordEmbed): number => {
	const titleLength = data.title?.length ?? 0;
	const descriptionLength = data.description?.length ?? 0;
	const fieldsLength = data.fields
		? data.fields.reduce(
				(acc, field) => acc + field.name.length + field.value.length,
				0
			)
		: 0;
	const footerLength = data.footer?.text.length ?? 0;
	const authorLength = data.author?.name.length ?? 0;
	const providerLength = data.provider?.name.length ?? 0;

	return (
		titleLength +
		descriptionLength +
		fieldsLength +
		footerLength +
		authorLength +
		providerLength
	);
};

const discordEmbedMaxCharactersRefinement = (
	data: z.infer<typeof _discordEmbedSchema>
) => {
	const maxChars = DiscordMagic.EMBED_TOTAL_MAX;
	return getTotalEmbedCharacters(data) <= maxChars;
};

const discordEmbedSchema = _discordEmbedSchema.refine(
	discordEmbedMaxCharactersRefinement,
	{
		message: `Total embed content cannot exceed ${DiscordMagic.EMBED_TOTAL_MAX} characters.`,
	}
);

const discordEmbedsMaxCharactersRefinement = (
	embeds: z.infer<typeof discordEmbedSchema>[]
) => {
	const maxChars = DiscordMagic.EMBED_TOTAL_MAX;
	const totalChars = embeds.reduce(
		(acc, embed) => acc + getTotalEmbedCharacters(embed),
		0
	);
	return totalChars <= maxChars;
};

const discordEmbedsSchema = z
	.array(discordEmbedSchema)
	.max(
		DiscordMagic.MESSAGE_EMBEDS_MAX,
		`Cannot have more than ${DiscordMagic.MESSAGE_EMBEDS_MAX} embeds in a single message.`
	)
	.refine(discordEmbedsMaxCharactersRefinement, {
		message: `Total content of combined embeds cannot exceed ${DiscordMagic.EMBED_TOTAL_MAX} characters.`,
	})
	.describe('Array of Discord embed objects.');

type DiscordEmbeds = z.infer<typeof discordEmbedsSchema>;

type DiscordEmbedColor = HexColor;
type DiscordEmbedType = EmbedType;
type DiscordEmbedField = z.infer<typeof discordEmbedFieldSchema>;
type DiscordEmbedProvider = z.infer<typeof discordEmbedProviderSchema>;
type DiscordEmbedAuthor = z.infer<typeof discordEmbedAuthorSchema>;
type DiscordEmbedImage = z.infer<typeof discordEmbedImageSchema>;
type DiscordEmbedThumbnail = z.infer<typeof discordEmbedThumbnailSchema>;
type DiscordEmbedFooter = z.infer<typeof discordEmbedFooterSchema>;

export type {
	DiscordEmbed,
	DiscordEmbedAuthor,
	DiscordEmbedColor,
	DiscordEmbedField,
	DiscordEmbedFooter,
	DiscordEmbedImage,
	DiscordEmbedProvider,
	DiscordEmbeds,
	DiscordEmbedThumbnail,
	DiscordEmbedType,
	DiscordSnowflake,
	DiscordWebhookUrl,
};

export {
	allowedDiscordWebhookHosts,
	discordEmbedColorSchema,
	discordEmbedSchema,
	discordEmbedsSchema,
	discordSnowflakeSchema,
	discordWebhookPathRegex,
	discordWebhookUrlSchema,
	EmbedType,
};
