import {
	type APIInteractionGuildMember,
	BaseInteraction,
	type Channel,
	type Collection,
	type Guild,
	type GuildMember,
	type Interaction,
	type User,
} from 'discord.js';
import type { ClientComponent, ClientComponentWithCooldown } from './types';

type ClientCooldownType = 'user' | 'member' | 'channel' | 'guild' | 'global';

type ClientCooldownOptions = {
	/** * The cooldown duration in milliseconds. */
	duration: number;
	/**
	 * The type of cooldown - who or what does the cooldown apply to?
	 *
	 * - `user`: Cooldown applies to the user across all guilds and channels. If a user triggers the cooldown, they cannot trigger it again until it expires, regardless of where they are.
	 * - `member`: Cooldown applies to the user within a specific guild. If a user triggers the cooldown in a guild, they cannot trigger it again in that guild until it expires, but they can trigger it in other guilds.
	 * - `channel`: Cooldown applies to the channel. If a user triggers the cooldown in a channel, no one can trigger it again in that channel until it expires, but they can trigger it in other channels.
	 * - `guild`: Cooldown applies to the entire guild. If a user triggers the cooldown in a guild, no one can trigger it again in that guild until it expires, but they can trigger it in other guilds.
	 * - `global`: Cooldown applies globally across all guilds and channels. If a user triggers the cooldown, no one can trigger it again anywhere until it expires.
	 * */
	type: ClientCooldownType;
};

type CooldownCollection = Collection<string, Map<string, number>>;

type CooldownTargetResource<CT extends ClientCooldownType> = CT extends 'user'
	? User
	: CT extends 'member'
		?
				| GuildMember
				| (APIInteractionGuildMember & {
						id: string;
				  })
		: CT extends 'channel'
			? Channel
			: CT extends 'guild'
				? Guild
				: CT extends 'global'
					? ClientComponent
					: never;

class CooldownManager {
	private cooldowns: CooldownCollection;

	constructor(cooldowns: CooldownCollection) {
		this.cooldowns = cooldowns;
	}

	cooldownKey(id: string, type: ClientCooldownType): string {
		return `${type}:${id}`;
	}

	targetIdResolver<CT extends ClientCooldownType>(
		type: CT,
		target: CooldownTargetResource<CT>
	): string {
		return `${type}:${target.id}`;
	}

	interactionTargetResolver<CT extends ClientCooldownType>(
		component: ClientComponentWithCooldown,
		interaction: Interaction
	): CooldownTargetResource<CT> {
		const type = component.cooldown.type;
		const commonGuildErrorSuffix =
			'Consider setting the "contexts" for originating ClientComponent#data to [InteractionContextType.Guild], or changing cooldown type to "user".';
		switch (type) {
			case 'user':
				return interaction.user as CooldownTargetResource<CT>;
			case 'member':
				if (!interaction.inGuild()) {
					throw new Error(
						`Member cooldowns cannot be applied in DMs. ${commonGuildErrorSuffix}`
					);
				}
				if (!('id' in interaction.member)) {
					Object.defineProperty(interaction.member, 'id', {
						value: interaction.user.id,
						writable: false,
					});
				}
				return interaction.member as CooldownTargetResource<CT>;
			case 'channel':
				if (!interaction.channel) {
					throw new Error(
						`Channel cooldowns cannot be applied because the interaction has no channel. ${commonGuildErrorSuffix}`
					);
				}
				return interaction.channel as CooldownTargetResource<CT>;
			case 'guild':
				if (!interaction.inGuild()) {
					throw new Error(
						`Guild cooldowns cannot be applied in DMs. ${commonGuildErrorSuffix}`
					);
				}
				return interaction.guild as CooldownTargetResource<CT>;
			case 'global':
				return component as CooldownTargetResource<CT>;
			default:
				throw new Error(`Unsupported cooldown type: ${type}`);
		}
	}

	cooldownMapForComponent<ShouldCreateIfMissing extends boolean = false>(
		component: ClientComponentWithCooldown,
		shouldCreateIfMissing = false
	): ShouldCreateIfMissing extends true
		? [string, Map<string, number>]
		: [string, Map<string, number> | undefined] {
		const type = component.cooldown.type;
		const cooldownKey = this.cooldownKey(component.id, type);
		let cooldownMap = this.cooldowns.get(cooldownKey);

		if (!cooldownMap && shouldCreateIfMissing) {
			cooldownMap = new Map<string, number>();
			this.cooldowns.set(cooldownKey, cooldownMap);
		}

		return [cooldownKey, cooldownMap] as ShouldCreateIfMissing extends true
			? [string, Map<string, number>]
			: [string, Map<string, number> | undefined];
	}

	isOnCooldown(
		component: ClientComponentWithCooldown,
		target: CooldownTargetResource<ClientCooldownType> | Interaction
	): boolean {
		const now = Date.now();
		const type = component.cooldown.type;
		const [componentCooldownKey, componentCooldownMap] =
			this.cooldownMapForComponent(component, false);
		if (!componentCooldownMap) return false;

		const resolvedTarget =
			target instanceof BaseInteraction
				? this.interactionTargetResolver(component, target)
				: target;
		const targetId = this.targetIdResolver(type, resolvedTarget);
		const expiresAt = componentCooldownMap.get(targetId);

		if (!expiresAt) return false;
		if (now >= expiresAt) {
			componentCooldownMap.delete(targetId);
			if (componentCooldownMap.size === 0) {
				this.cooldowns.delete(componentCooldownKey);
			}
			return false;
		}

		return true;
	}

	setCooldown(
		component: ClientComponentWithCooldown,
		target: CooldownTargetResource<ClientCooldownType>,
		duration?: number
	): void {
		const type = component.cooldown.type;
		const cooldownDuration = duration ?? component.cooldown.duration;
		let [componentCooldownKey, componentCooldownMap] =
			this.cooldownMapForComponent(component, true);

		const expiresAt = Date.now() + cooldownDuration;
		if (!componentCooldownMap) {
			componentCooldownMap = new Map<string, number>();
			this.cooldowns.set(componentCooldownKey, componentCooldownMap);
		}

		const targetId = this.targetIdResolver(type, target);
		componentCooldownMap.set(targetId, expiresAt);

		setTimeout(() => {
			const [componentCooldownKey, componentCooldownMap] =
				this.cooldownMapForComponent(component);
			componentCooldownMap?.delete(targetId);
			if (componentCooldownMap && componentCooldownMap.size === 0) {
				this.cooldowns.delete(componentCooldownKey);
			}
		}, cooldownDuration);
	}
}

export {
	type ClientCooldownOptions,
	type ClientCooldownType,
	type CooldownCollection,
	CooldownManager,
	type CooldownTargetResource,
};
