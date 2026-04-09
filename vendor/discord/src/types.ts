import type {
	AnyComponentBuilder,
	AutocompleteInteraction,
	ButtonBuilder,
	ButtonInteraction,
	ChannelSelectMenuBuilder,
	ChannelSelectMenuInteraction,
	ChatInputCommandInteraction,
	ContextMenuCommandBuilder,
	ClientEvents as DiscordClientEvents,
	Events,
	MentionableSelectMenuBuilder,
	MentionableSelectMenuInteraction,
	MessageComponentInteraction,
	MessageContextMenuCommandInteraction,
	ModalBuilder,
	ModalSubmitInteraction,
	RoleSelectMenuBuilder,
	RoleSelectMenuInteraction,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
	UserContextMenuCommandInteraction,
	UserSelectMenuBuilder,
	UserSelectMenuInteraction,
} from 'discord.js';
import type Client from './client';
import type { ClientCooldownOptions } from './cooldown';
import type { ClientListener } from './events';

type ClientComponentData =
	| SlashCommandBuilder
	| SlashCommandOptionsOnlyBuilder
	| SlashCommandSubcommandsOnlyBuilder
	| ContextMenuCommandBuilder
	| ModalBuilder
	| ButtonBuilder
	| StringSelectMenuBuilder
	| RoleSelectMenuBuilder
	| UserSelectMenuBuilder
	| ChannelSelectMenuBuilder
	| MentionableSelectMenuBuilder
	| AnyComponentBuilder;

type InteractionForData<TData extends ClientComponentData> = TData extends
	| SlashCommandBuilder
	| SlashCommandOptionsOnlyBuilder
	| SlashCommandSubcommandsOnlyBuilder
	? ChatInputCommandInteraction | AutocompleteInteraction
	: TData extends ContextMenuCommandBuilder
		? MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction
		: TData extends ModalBuilder
			? ModalSubmitInteraction
			: TData extends ButtonBuilder
				? ButtonInteraction
				: TData extends StringSelectMenuBuilder
					? StringSelectMenuInteraction
					: TData extends RoleSelectMenuBuilder
						? RoleSelectMenuInteraction
						: TData extends UserSelectMenuBuilder
							? UserSelectMenuInteraction
							: TData extends ChannelSelectMenuBuilder
								? ChannelSelectMenuInteraction
								: TData extends MentionableSelectMenuBuilder
									? MentionableSelectMenuInteraction
									: MessageComponentInteraction;

type InteractionForDataWithoutAutocomplete<TData extends ClientComponentData> =
	Exclude<InteractionForData<TData>, AutocompleteInteraction>;

type ClientComponentOptions<
	TData extends ClientComponentData = ClientComponentData,
> = {
	id: string;
	data: TData;
	execute: (ctx: {
		client: Client<true>;
		interaction: InteractionForDataWithoutAutocomplete<TData>;
	}) => Promise<void>;
	cooldown?: ClientCooldownOptions;
	autocompletes?: {
		[optionName: string]: (
			interaction: AutocompleteInteraction,
			query: string
		) => Promise<void>;
	};
};

type ClientComponent<TData extends ClientComponentData = ClientComponentData> =
	Required<
		Omit<ClientComponentOptions<TData>, 'cooldown'> & {
			cooldown: ClientComponentOptions<TData>['cooldown'] | null;
			hasCooldown: () => this is ClientComponentWithCooldown<TData>;
		}
	>;

type ClientComponentWithCooldown<
	TData extends ClientComponentData = ClientComponentData,
> = Omit<ClientComponent<TData>, 'cooldown'> & {
	cooldown: ClientCooldownOptions;
};

type RegistryComponent = ClientComponent | ClientListener;

type ComponentRegistry = RegistryComponent[];

interface ClientEventListenerOptions<Event extends keyof DiscordClientEvents> {
	id: string;
	once?: boolean;
	event: Event;
	cooldown?: ClientCooldownOptions;
	execute: Event extends Events.ClientReady
		? (client: Client<true>) => void
		: (client: Client<true>, ...args: DiscordClientEvents[Event]) => void;
}

type ClientEventListener<Event extends keyof DiscordClientEvents> = Required<
	Omit<ClientEventListenerOptions<Event>, 'cooldown'>
> & {
	cooldown: ClientCooldownOptions | null;
};

export type {
	ClientComponent,
	ClientComponentData,
	ClientComponentOptions,
	ClientComponentWithCooldown,
	ClientEventListener,
	ClientEventListenerOptions,
	ComponentRegistry,
	InteractionForData,
	RegistryComponent,
};
