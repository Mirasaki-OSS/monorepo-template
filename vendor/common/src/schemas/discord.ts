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

const discordSnowflakeSchema = z
	.string()
	.regex(/^\d{17,19}$/)
	.describe(
		'Discord snowflake ID represented as a numeric string (typically 17 to 19 digits).'
	);

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

const discordWebhookUrlSchema = z
	.url()
	.describe(
		'Discord webhook URL. Must use https and a supported Discord host; normalized to the canonical discord.com host.'
	)
	.transform((value, ctx) => {
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
	'Color in hexadecimal format (e.g., #FF5733). Displayed as a colored strip on the left side of the embed.'
);

const discordEmbedThumbnailSchema = z
	.object({
		url: z
			.url()
			.describe(
				'Image URL for the small thumbnail shown in the top-right of the embed.'
			),
		width: z
			.number()
			.int()
			.positive()
			.optional()
			.describe('Known width of the thumbnail in pixels.'),
		height: z
			.number()
			.int()
			.positive()
			.optional()
			.describe('Known height of the thumbnail in pixels.'),
	})
	.describe(
		'Optional thumbnail to display in the top-right side of the embed. Can be used to provide a small preview image related to the embed content.'
	);

const discordEmbedFooterSchema = z
	.object({
		text: z
			.string()
			.describe('Footer text shown at the bottom of the embed.')
			.max(
				DiscordMagic.EMBED_FOOTER_MAX,
				`Footer text exceeds the Discord limit of ${DiscordMagic.EMBED_FOOTER_MAX} characters.`
			),
		icon_url: z
			.url()
			.optional()
			.describe('Optional icon URL displayed next to the footer text.'),
	})
	.describe(
		'Optional footer to display at the bottom of the embed. Can be used for additional context or information about the embed content.'
	);

const discordEmbedFieldSchema = z
	.object({
		name: z
			.string()
			.describe('Field label shown above the field value.')
			.max(
				DiscordMagic.EMBED_FIELD_NAME_MAX,
				`Field name exceeds the Discord limit of ${DiscordMagic.EMBED_FIELD_NAME_MAX} characters.`
			),
		value: z
			.string()
			.describe('Field body text; supports markdown-like Discord formatting.')
			.max(
				DiscordMagic.EMBED_FIELD_VALUE_MAX,
				`Field value exceeds the Discord limit of ${DiscordMagic.EMBED_FIELD_VALUE_MAX} characters.`
			),
		inline: z
			.boolean()
			.optional()
			.describe('Render this field in the same row as other inline fields.'),
	})
	.describe(
		'Field(s) to display in the Discord embed. Can be used to present additional information in a structured format within the embed.'
	);

const discordEmbedProviderSchema = z
	.object({
		name: z
			.string()
			.describe(
				'Source/provider name shown above the author line, when present.'
			)
			.max(
				DiscordMagic.EMBED_PROVIDER_MAX,
				`Provider name exceeds the Discord limit of ${DiscordMagic.EMBED_PROVIDER_MAX} characters.`
			),
		url: z.url().describe('Canonical link for the provider/source.'),
	})
	.describe(
		'Optional provider to display at the top of the embed, above the author. Can be used to indicate the source of the embed content.'
	);

const discordEmbedAuthorSchema = z
	.object({
		name: z
			.string()
			.describe(
				'Display name shown in the author row near the top of the embed.'
			)
			.max(
				DiscordMagic.EMBED_AUTHOR_MAX,
				`Author name exceeds the Discord limit of ${DiscordMagic.EMBED_AUTHOR_MAX} characters.`
			),
		url: z
			.url()
			.optional()
			.describe('Link opened when the author name is clicked.'),
		icon_url: z
			.url()
			.optional()
			.describe('Avatar/icon URL displayed before the author name.'),
	})
	.describe(
		'Optional author to display at the top of the embed, above the title - but underneath the provider. Can be used to indicate the creator of the embed content.'
	);

const discordEmbedImageSchema = z
	.object({
		url: z
			.url()
			.describe('Image URL rendered in the main media area of the embed body.'),
		width: z
			.number()
			.int()
			.positive()
			.optional()
			.describe('Known width of the image in pixels.'),
		height: z
			.number()
			.int()
			.positive()
			.optional()
			.describe('Known height of the image in pixels.'),
	})
	.describe(
		'Optional image to display in the main body of the embed. Can be used to provide a large visual element related to the embed content. Rendered below the description and fields, and above the footer.'
	);

const discordEmbedSchemaBase = z.object({
	title: z
		.string()
		.max(
			DiscordMagic.EMBED_TITLE_MAX,
			`Embed title exceeds the Discord limit of ${DiscordMagic.EMBED_TITLE_MAX} characters.`
		)
		.optional()
		.nullable()
		.describe('Title of the Discord embed message.'),
	description: z
		.string()
		.max(
			DiscordMagic.EMBED_DESCRIPTION_MAX,
			`Embed description exceeds the Discord limit of ${DiscordMagic.EMBED_DESCRIPTION_MAX} characters.`
		)
		.optional()
		.nullable()
		.describe('Description text of the Discord embed message.'),
	color: discordEmbedColorSchema
		.optional()
		.nullable()
		.describe(
			'Left accent color for the embed, as a hexadecimal value (e.g., #FF5733). Set null to explicitly clear it.'
		),
	url: z
		.url()
		.optional()
		.nullable()
		.describe('Primary URL associated with the embed title or content.'),
	timestamp: z
		.string()
		.optional()
		.nullable()
		.describe(
			'ISO 8601 timestamp shown in the footer time area (for example, 2026-04-12T09:30:00.000Z).'
		),
	type: z
		.enum([
			EmbedType.Rich,
			EmbedType.GIFV,
			EmbedType.Image,
			EmbedType.Video,
			EmbedType.Article,
			EmbedType.Link,
			EmbedType.AutoModerationMessage,
			EmbedType.PollResult,
		])
		.optional()
		.default(EmbedType.Rich)
		.describe(
			'Embed render type. Use rich for custom embeds sent by bots/webhooks.'
		),
});

const _discordEmbedSchema = discordEmbedSchemaBase
	.extend({
		thumbnail: discordEmbedThumbnailSchema.optional(),
		footer: discordEmbedFooterSchema.optional(),
		fields: z
			.array(discordEmbedFieldSchema)
			.max(
				DiscordMagic.EMBED_FIELDS_MAX,
				`A Discord embed can have at most ${DiscordMagic.EMBED_FIELDS_MAX} fields.`
			)
			.optional()
			.describe(
				'Optional array of fields to display in the embed. Fields are displayed in the order they are provided.'
			),
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
		message: `Embed text content exceeds the Discord limit of ${DiscordMagic.EMBED_TOTAL_MAX} characters.`,
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
		`A message can include at most ${DiscordMagic.MESSAGE_EMBEDS_MAX} embeds.`
	)
	.refine(discordEmbedsMaxCharactersRefinement, {
		message: `Combined embed text content exceeds the Discord limit of ${DiscordMagic.EMBED_TOTAL_MAX} characters.`,
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
