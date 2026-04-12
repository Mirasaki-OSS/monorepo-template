import { hexColorToInt } from '@md-oss/common/schemas/colors';
import {
	type DiscordEmbed,
	type DiscordEmbeds,
	discordEmbedSchema,
	discordEmbedsSchema,
	EmbedType,
} from '@md-oss/common/schemas/discord';
import { EmbedBuilder } from 'discord.js';

/**
 * @throws ZodError if the data is invalid
 */
export const validateDiscordEmbedData = (data: unknown) => {
	return discordEmbedSchema.parse(data);
};

/**
 * @throws ZodError if the data is invalid
 */
export const validateDiscordEmbedsData = (data: unknown) => {
	return discordEmbedsSchema.parse(data);
};

export const validateDiscordEmbedDataSafe = (data: unknown) => {
	return discordEmbedSchema.safeParse(data);
};

export const validateDiscordEmbedsDataSafe = (data: unknown) => {
	return discordEmbedsSchema.safeParse(data);
};

/**
 * Type guard to check if the data is a valid Discord embed object.
 */
export const isValidDiscordEmbedData = (
	data: unknown
): data is DiscordEmbed => {
	return discordEmbedSchema.safeParse(data).success;
};

/**
 * Type guard to check if the data is a valid array of Discord embed objects.
 */
export const isValidDiscordEmbedsData = (
	data: unknown
): data is DiscordEmbeds => {
	return discordEmbedsSchema.safeParse(data).success;
};

/**
 * Utility function to build a Discord.js EmbedBuilder from a {@link DiscordEmbed} data object.
 * @see {@link validateDiscordEmbedData} for validating the input data before building the embed.
 */
export const buildEmbedFromData = (data: DiscordEmbed): EmbedBuilder => {
	const builder = new EmbedBuilder();

	if (data.title) builder.setTitle(data.title);
	if (data.description) builder.setDescription(data.description);
	if (data.url) builder.setURL(data.url);
	if (data.color) builder.setColor(hexColorToInt(data.color));
	if (data.timestamp) builder.setTimestamp(new Date(data.timestamp));
	if (data.author) {
		const { name, url, icon_url } = data.author;
		builder.setAuthor({ name, url, iconURL: icon_url });
	}
	if (data.fields) {
		for (const field of data.fields) {
			builder.addFields({
				name: field.name,
				value: field.value,
				inline: field.inline ?? false,
			});
		}
	}
	if (data.footer) {
		const { text, icon_url } = data.footer;
		builder.setFooter({ text, iconURL: icon_url });
	}
	if (data.image) {
		builder.setImage(data.image.url);
	}
	if (data.thumbnail) {
		builder.setThumbnail(data.thumbnail.url);
	}
	if (data.provider) {
		const { name, url } = data.provider;
		builder.data.provider = { name, url };
	}
	if (data.type) {
		builder.data.type = data.type;
	}

	return builder;
};

/**
 * Utility function to build an array of Discord.js EmbedBuilder instances from an array of {@link DiscordEmbed} data objects.
 *
 * @see {@link buildEmbedFromData} for building a single embed from data.
 */
export const buildEmbedsFromData = (data: DiscordEmbeds): EmbedBuilder[] => {
	return data.map(buildEmbedFromData);
};

/**
 * Merges multiple Discord embed objects into a single embed object.
 * Later embeds in the arguments list will override properties of earlier embeds if they have the same property defined.
 * Fields from all embeds will be combined into a single array of fields in the resulting embed.
 * This is useful for cases where you want to construct an embed from multiple sources of data.
 * @see {@link validateDiscordEmbedData} for validating the resulting embed data after merging.
 */
export const mergeEmbedData = (...embeds: DiscordEmbed[]): DiscordEmbed => {
	const merged: DiscordEmbed = {
		type: EmbedType.Rich,
	};

	for (const embed of embeds) {
		if (embed.title) merged.title = embed.title;
		if (embed.description) merged.description = embed.description;
		if (embed.url) merged.url = embed.url;
		if (embed.color) merged.color = embed.color;
		if (embed.timestamp) merged.timestamp = embed.timestamp;
		if (embed.author) merged.author = embed.author;
		if (embed.fields) {
			merged.fields = [...(merged.fields ?? []), ...embed.fields];
		}
		if (embed.footer) merged.footer = embed.footer;
		if (embed.image) merged.image = embed.image;
		if (embed.thumbnail) merged.thumbnail = embed.thumbnail;
		if (embed.provider) merged.provider = embed.provider;
		if (embed.type) merged.type = embed.type;
	}

	return merged;
};
