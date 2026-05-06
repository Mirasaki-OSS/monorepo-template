import { DiscordMagic } from '@md-oss/common/constants/discord';
import {
	AttachmentBuilder,
	type InteractionReplyOptions,
	type MessageEditOptions,
} from 'discord.js';

type OverflowMessagePayloadOptions = {
	fileName?: string;
	overflowMessage?: string;
};

type OverflowMessagePayload = InteractionReplyOptions & MessageEditOptions;

const buildOverflowSafeMessagePayload = (
	text: string,
	options: OverflowMessagePayloadOptions = {}
): OverflowMessagePayload => {
	if (text.length <= DiscordMagic.MESSAGE_CONTENT_MAX) {
		return { content: text };
	}

	const fileName = options.fileName ?? 'message.txt';
	const overflowMessage =
		options.overflowMessage ??
		'This output is too long for a normal message, so it has been attached as a file.';

	return {
		content: overflowMessage,
		files: [
			new AttachmentBuilder(Buffer.from(text, 'utf8'), { name: fileName }),
		],
	};
};

export {
	buildOverflowSafeMessagePayload,
	type OverflowMessagePayload,
	type OverflowMessagePayloadOptions,
};
