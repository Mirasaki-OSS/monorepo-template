import { StringUtils } from '@md-oss/common';
import type { EmbedBuilder, RepliableInteraction } from 'discord.js';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
	StringSelectMenuBuilder,
} from 'discord.js';
import type Client from './client';

type InteractionPaginationOptions = {
	/**
	 * Each page can be either a single EmbedBuilder, an array of EmbedBuilders, or a string (for simple text content). The pagination handler will need to determine how to send each page based on its type.
	 */
	pages: (EmbedBuilder | EmbedBuilder[] | string)[];
	/**
	 * The initial page index to display when the pagination is first sent. This is optional and defaults to 0 (the first page) if not provided. The pagination handler ensures that this index is within the bounds of the pages array.
	 */
	initialPage?: number;
	/**
	 * The amount of time in milliseconds that the pagination controls should remain active before they are automatically disabled. This is optional and defaults to 5 minutes (300,000 ms) if not provided.
	 */
	timeoutMs?: number;
	/**
	 * An optional function that generates the label for each page in the select menu based on the page index. If not provided, it defaults to a function that returns "Page X" where X is the 1-based page index.
	 */
	labelGenerator?: (pageIndex: number) => string;
};

type HandlePaginationParams = {
	/**
	 * The instance of the Client that is handling the pagination
	 */
	client: Client<true>;
	/**
	 * The interaction that triggered the pagination. This will be used to send follow-up messages or edits for pagination controls.
	 */
	interaction: RepliableInteraction;
	/**
	 * The pagination configuration, including the pages to display and the initial page index. Each page can be an EmbedBuilder, an array of EmbedBuilders, or a string for simple text content.
	 */
	pagination: InteractionPaginationOptions;
};

type ResolvedPagination = {
	pages: number;
	currentPage: number;
};

const MAX_SELECT_PAGE_OPTIONS = 25;
const CENTER_WINDOW_RADIUS = 12;

const resolveSelectOptionRange = ({
	pages,
	currentPage,
}: ResolvedPagination) => {
	if (pages <= MAX_SELECT_PAGE_OPTIONS) {
		return {
			start: 0,
			end: pages - 1,
		};
	}

	if (currentPage < MAX_SELECT_PAGE_OPTIONS) {
		return {
			start: 0,
			end: MAX_SELECT_PAGE_OPTIONS - 1,
		};
	}

	if (currentPage >= pages - MAX_SELECT_PAGE_OPTIONS) {
		return {
			start: pages - MAX_SELECT_PAGE_OPTIONS,
			end: pages - 1,
		};
	}

	return {
		start: currentPage - CENTER_WINDOW_RADIUS,
		end: currentPage + CENTER_WINDOW_RADIUS,
	};
};

const paginationComponentRows = ({
	pages,
	currentPage,
	disabled = false,
	pageLabelGenerator = (pageIndex) => `Page ${pageIndex + 1}`,
}: ResolvedPagination & {
	disabled?: boolean;
	pageLabelGenerator?: (pageIndex: number) => string;
}): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] => {
	if (pages <= 1) {
		return [];
	}

	const isOnFirstPage = currentPage === 0;
	const isOnLastPage = currentPage === pages - 1;
	const showBoundaryButtons = pages > MAX_SELECT_PAGE_OPTIONS;
	const selectOptionRange = resolveSelectOptionRange({
		pages,
		currentPage,
	});

	const navigationButtons: ButtonBuilder[] = [];

	if (showBoundaryButtons) {
		navigationButtons.push(
			new ButtonBuilder()
				.setCustomId('.pagination:first_page')
				.setLabel('First')
				.setEmoji('⏮️')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(isOnFirstPage || disabled)
		);
	}

	navigationButtons.push(
		new ButtonBuilder()
			.setCustomId('.pagination:prev_page')
			.setLabel(
				isOnFirstPage ? 'Currently on First Page' : `Previous (${currentPage})`
			)
			.setEmoji('⬅️')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(isOnFirstPage || disabled),
		new ButtonBuilder()
			.setCustomId('.pagination:next_page')
			.setLabel(
				isOnLastPage
					? 'Currently on Last Page'
					: `Next (${currentPage + 2} of ${pages})`
			)
			.setEmoji('➡️')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(isOnLastPage || disabled)
	);

	if (showBoundaryButtons) {
		navigationButtons.push(
			new ButtonBuilder()
				.setCustomId('.pagination:last_page')
				.setLabel('Last')
				.setEmoji('⏭️')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(isOnLastPage || disabled)
		);
	}

	const rows: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = [
		new ActionRowBuilder<ButtonBuilder>().addComponents(...navigationButtons),
	];

	if (pages > 2) {
		rows.push(
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId('.pagination:select_page')
					.setPlaceholder('Select a page')
					.setDisabled(disabled)
					.setMinValues(1)
					.setMaxValues(1)
					.addOptions(
						Array.from(
							{
								length: selectOptionRange.end - selectOptionRange.start + 1,
							},
							(_, offset) => {
								const pageIndex = selectOptionRange.start + offset;

								return {
									label: StringUtils.truncate(
										pageLabelGenerator?.(pageIndex) || `Page ${pageIndex + 1}`,
										25
									),
									value: pageIndex.toString(),
									default: pageIndex === currentPage,
								};
							}
						)
					)
			)
		);
	}

	return rows;
};

const handleInteractionPagination = async ({
	client,
	interaction,
	pagination: {
		pages,
		initialPage = 0,
		timeoutMs = 1000 * 60 * 5,
		labelGenerator,
	},
}: HandlePaginationParams) => {
	const totalPages = pages.length;
	let currentPage = Math.max(0, Math.min(initialPage, totalPages - 1));

	const sendPage = async (
		interaction: RepliableInteraction,
		pageIndex: number
	): ReturnType<Client<true>['safeReply']> => {
		const pageContent = pages[pageIndex];
		const paginationControls = paginationComponentRows({
			pages: totalPages,
			currentPage: pageIndex,
			pageLabelGenerator: labelGenerator,
		});

		if (typeof pageContent === 'string') {
			return client.safeReply(interaction, {
				content: pageContent,
				embeds: [],
				components: paginationControls,
			});
		} else {
			return client.safeReply(interaction, {
				content: '',
				embeds: Array.isArray(pageContent) ? pageContent : [pageContent],
				components: paginationControls,
			});
		}
	};

	const messageOrInteractionResponse = await sendPage(
		interaction,
		currentPage
	).catch(async (error) => {
		console.error('Error sending paginated content:', error);
		return client.safeReply(interaction, {
			content: 'An error occurred while sending the paginated content.',
			embeds: [],
			components: [],
		});
	});

	const collector =
		messageOrInteractionResponse.createMessageComponentCollector({
			time: timeoutMs,
			dispose: true,
			filter: (i) => i.customId.startsWith('.pagination:'),
		});

	collector.on('collect', async (i) => {
		if (i.user.id !== interaction.user.id) {
			await client.safeReply(i, {
				content:
					'Only the user who initiated the pagination can interact with the controls.',
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const [, action] = i.customId.split(':');

		switch (action) {
			case 'first_page':
				currentPage = 0;
				break;
			case 'prev_page':
				currentPage = Math.max(0, currentPage - 1);
				break;
			case 'next_page':
				currentPage = Math.min(totalPages - 1, currentPage + 1);
				break;
			case 'last_page':
				currentPage = totalPages - 1;
				break;
			case 'select_page': {
				if (!i.isStringSelectMenu()) {
					console.warn(
						'Received unexpected interaction type for page selection:',
						i
					);
					return;
				}
				const selectedPage = parseInt(i.values[0], 10);
				if (!Number.isNaN(selectedPage)) {
					currentPage = Math.max(0, Math.min(selectedPage, totalPages - 1));
				}
				break;
			}
			default:
				console.warn('Unknown pagination action:', action);
				return;
		}

		await i.deferUpdate().catch((error) => {
			console.error('Error deferring pagination interaction update:', error);
		});
		await sendPage(i, currentPage);
	});

	collector.on('end', async () => {
		await messageOrInteractionResponse
			.edit({
				components: paginationComponentRows({
					pages: totalPages,
					currentPage,
					disabled: true,
				}),
			})
			.catch((error) => {
				console.error('Error disabling pagination controls:', error);
			});
	});
};

export {
	type HandlePaginationParams,
	handleInteractionPagination,
	paginationComponentRows,
};
