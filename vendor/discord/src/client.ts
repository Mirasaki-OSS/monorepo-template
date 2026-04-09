import {
	ButtonBuilder,
	ChannelSelectMenuBuilder,
	Collection,
	ContextMenuCommandBuilder,
	Client as DiscordClient,
	type ClientEvents as DiscordClientEvents,
	type ClientOptions as DiscordClientOptions,
	type Interaction,
	type InteractionReplyOptions,
	type InteractionResponse,
	MentionableSelectMenuBuilder,
	type Message,
	MessageFlags,
	ModalBuilder,
	REST,
	type RESTPostAPIChatInputApplicationCommandsJSONBody,
	type RESTPostAPIContextMenuApplicationCommandsJSONBody,
	type RepliableInteraction,
	RoleSelectMenuBuilder,
	Routes,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	UserSelectMenuBuilder,
} from 'discord.js';
import { type CooldownCollection, CooldownManager } from './cooldown';
import { ClientListener } from './events';
import type {
	ClientComponent,
	ClientComponentData,
	InteractionForData,
	RegistryComponent,
} from './types';

type ClientOptions = DiscordClientOptions & {
	components: RegistryComponent[];
};

class Client<Ready extends boolean = boolean> extends DiscordClient<Ready> {
	readonly commands = new Collection<string, ClientComponent>();
	readonly events = new Collection<string, ClientListener>();
	readonly cooldowns: CooldownCollection = new Collection();
	readonly cooldownManager = new CooldownManager(this.cooldowns);

	constructor(options: ClientOptions) {
		super(options);
		for (const component of options.components) {
			if (component instanceof ClientListener) {
				if (this.events.has(component.id)) {
					console.warn(
						`Duplicate event listener ID detected: ${component.id}, overwriting existing listener.`
					);
				}
				this.events.set(component.id, component);
			} else {
				if (this.commands.has(component.id)) {
					console.warn(
						`Duplicate command ID detected: ${component.id}, overwriting existing command.`
					);
				}
				this.commands.set(component.id, component);
			}
		}

		this.on('interactionCreate', this.handleInteraction);

		// Note: Can not rely on the 'ready' event for the ready client, as any
		// this.events listeners for clientReady would not be registered in time.
		const readyClient = this as Client<true>;
		for (const listener of this.events.values()) {
			this.registerListener(listener, readyClient);
		}
	}

	get commandApiData() {
		const commandData: (
			| RESTPostAPIChatInputApplicationCommandsJSONBody
			| RESTPostAPIContextMenuApplicationCommandsJSONBody
		)[] = [];

		for (const component of this.commands.values()) {
			const data = component.data;
			if (
				data instanceof SlashCommandBuilder ||
				data instanceof ContextMenuCommandBuilder
			) {
				commandData.push(data.toJSON());
			}
		}

		return commandData;
	}

	private registerListener(
		listener: ClientListener,
		readyClient: Client<true>
	) {
		const event = listener.event as keyof DiscordClientEvents;
		// Note: Down-casting avoids TS2590: "Expression produces a union type that is too complex to represent."
		const execute = listener.execute as (
			client: Client<true>,
			...args: unknown[]
		) => void;
		const run = (...args: unknown[]) => void execute(readyClient, ...args);

		if (listener.once) {
			this.once(event, run);
		} else {
			this.on(event, run);
		}
	}

	readonly registerCommands = async (options: {
		clientId: string;
		token: string;
		guildId?: string;
		commands?: (
			| RESTPostAPIChatInputApplicationCommandsJSONBody
			| RESTPostAPIContextMenuApplicationCommandsJSONBody
		)[];
	}) => {
		const { clientId, token, guildId, commands } = options;
		const commandData = Array.isArray(commands)
			? commands
			: this.commandApiData;

		if (!this.isReady()) {
			const rest = new REST().setToken(token);
			if (guildId) {
				await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
					body: commandData,
				});
			} else {
				await rest.put(Routes.applicationCommands(clientId), {
					body: commandData,
				});
			}
			console.log('Commands registered successfully via REST API');
			return;
		}

		if (guildId) {
			await this.application.commands.set(commandData, guildId);
		} else {
			await this.application.commands.set(commandData);
		}

		console.log('Commands registered successfully');
	};

	readonly getComponentById = (id: string): ClientComponent | undefined => {
		const component = this.commands.get(id);
		if (component) {
			return component;
		}
		return undefined;
	};

	readonly getComponentByInteraction = <TData extends ClientComponentData>(
		interaction: Interaction
	): ClientComponent<TData> | undefined => {
		if (
			interaction.isCommand() ||
			interaction.isContextMenuCommand() ||
			interaction.isAutocomplete()
		) {
			return this.commands.find(
				(c) => 'name' in c.data && c.data.name === interaction.commandName
			) as ClientComponent<TData> | undefined;
		} else if (
			interaction.isButton() ||
			interaction.isStringSelectMenu() ||
			interaction.isRoleSelectMenu() ||
			interaction.isUserSelectMenu() ||
			interaction.isChannelSelectMenu() ||
			interaction.isMentionableSelectMenu() ||
			interaction.isModalSubmit()
		) {
			return this.commands.find((c) => c.id === interaction.customId) as
				| ClientComponent<TData>
				| undefined;
		}
		return undefined;
	};

	readonly safeReply = async (
		interaction: RepliableInteraction,
		response: string | InteractionReplyOptions
	): Promise<Message<boolean> | InteractionResponse<boolean>> => {
		const content =
			typeof response === 'string' ? { content: response } : response;

		if (interaction.replied || interaction.deferred) {
			return interaction
				.editReply({
					...content,
					flags: [],
				})
				.catch(async (error) => {
					console.error('Error editing reply:', error);
					return interaction.followUp({
						...content,
						flags: [MessageFlags.Ephemeral],
						withResponse: true,
					});
				});
		} else {
			return interaction.reply({
				...content,
				flags: [MessageFlags.Ephemeral],
			});
		}
	};

	readonly safeReplyWithAutoComplete = async (
		interaction: Interaction,
		response: string
	): Promise<void> => {
		if (interaction.isAutocomplete()) {
			return interaction
				.respond([{ name: response, value: response }])
				.catch((error) => {
					console.error('Error sending autocomplete response:', error);
				});
		}

		return void this.safeReply(interaction, response);
	};

	readonly parseComponentInteraction = <TData extends ClientComponentData>(
		component: ClientComponent<TData>,
		interaction: Interaction
	): interaction is Extract<Interaction, InteractionForData<TData>> => {
		const data = component.data;

		if (data instanceof SlashCommandBuilder) {
			return interaction.isChatInputCommand() || interaction.isAutocomplete();
		}

		if (data instanceof ContextMenuCommandBuilder) {
			return interaction.isContextMenuCommand();
		}

		if (data instanceof ModalBuilder) {
			return interaction.isModalSubmit();
		}

		if (data instanceof ButtonBuilder) {
			return interaction.isButton();
		}

		if (data instanceof StringSelectMenuBuilder) {
			return interaction.isStringSelectMenu();
		}

		if (data instanceof RoleSelectMenuBuilder) {
			return interaction.isRoleSelectMenu();
		}

		if (data instanceof UserSelectMenuBuilder) {
			return interaction.isUserSelectMenu();
		}

		if (data instanceof ChannelSelectMenuBuilder) {
			return interaction.isChannelSelectMenu();
		}

		if (data instanceof MentionableSelectMenuBuilder) {
			return interaction.isMentionableSelectMenu();
		}

		return interaction.isMessageComponent();
	};

	readonly handleInteraction = async (
		interaction: Interaction
	): Promise<void> => {
		if (
			!interaction.isCommand() &&
			!interaction.isContextMenuCommand() &&
			!interaction.isButton() &&
			!interaction.isStringSelectMenu() &&
			!interaction.isRoleSelectMenu() &&
			!interaction.isUserSelectMenu() &&
			!interaction.isChannelSelectMenu() &&
			!interaction.isMentionableSelectMenu() &&
			!interaction.isModalSubmit() &&
			!interaction.isAutocomplete()
		) {
			return;
		}

		const command = this.getComponentByInteraction(interaction);

		if (!command) {
			console.warn(`No command found for interaction: ${interaction.id}`);
			return;
		}

		if (!this.parseComponentInteraction(command, interaction)) {
			console.warn(
				`Interaction type mismatch for command ${command.id}: ${interaction.type}`
			);
			return;
		}

		if (command.hasCooldown()) {
			const target = this.cooldownManager.interactionTargetResolver(
				command,
				interaction
			);
			if (this.cooldownManager.isOnCooldown(command, target)) {
				await this.safeReplyWithAutoComplete(
					interaction,
					'You are on cooldown for this command. Please try again later.'
				);
				return;
			}
			this.cooldownManager.setCooldown(command, target);
		}

		if (interaction.isAutocomplete()) {
			const focusedOption = interaction.options.getFocused(true);
			const name = focusedOption.name;
			const fn = command.autocompletes?.[name];
			if (!fn) {
				console.warn(
					`No autocomplete handler found for command ${command.id} and option ${name}`
				);
				return;
			}
			try {
				await fn(interaction, focusedOption.value);
			} catch (error) {
				console.error(
					`Error executing autocomplete for command ${command.id}:`,
					error
				);
			}
			return;
		}

		try {
			await command.execute({ client: this as Client<true>, interaction });
		} catch (error) {
			console.error(`Error executing command ${command.id}:`, error);
			await this.safeReply(
				interaction,
				'There was an error while executing this command!'
			);
		}
	};
}

export default Client;
