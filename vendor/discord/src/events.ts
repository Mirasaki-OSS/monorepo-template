import type { ClientEvents as DiscordClientEvents } from 'discord.js';
import type { ClientCooldownOptions } from './cooldown';
import type { ClientEventListener, ClientEventListenerOptions } from './types';

const defineListener = <
	Event extends keyof DiscordClientEvents = keyof DiscordClientEvents,
>(
	options: ClientEventListenerOptions<Event>
): ClientEventListener<Event> => new ClientListener(options);

class ClientListener<
	Event extends keyof DiscordClientEvents = keyof DiscordClientEvents,
> implements ClientEventListener<Event>
{
	readonly id: string;
	readonly once: boolean;
	readonly event: Event;
	readonly cooldown: ClientCooldownOptions | null;
	readonly execute: ClientEventListener<Event>['execute'];

	public static create<Event extends keyof DiscordClientEvents>(
		options: ClientEventListenerOptions<Event>
	): ClientEventListener<Event> {
		return new ClientListener(options);
	}

	constructor(options: ClientEventListenerOptions<Event>) {
		this.id = options.id;
		this.once = options.once ?? false;
		this.event = options.event;
		this.cooldown = options.cooldown ?? null;
		this.execute = options.execute;
	}
}

export { ClientListener, defineListener };
