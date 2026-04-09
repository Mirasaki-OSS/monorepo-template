# @md-oss/discord

Type-safe Discord.js toolkit for building bots with component and event registries.

## Features

- Typed client wrapper around discord.js
- Component-first command registration
- Event listener registry with optional cooldown support
- Interaction pagination helper for embeds and text pages

## Installation

```bash
pnpm add @md-oss/discord discord.js
```

## Quick Start

```ts
import {
	Client,
	defineComponent,
	defineListener,
} from '@md-oss/discord';
import { SlashCommandBuilder } from 'discord.js';

const ping = defineComponent({
	id: 'ping',
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with pong'),
	execute: async ({ client, interaction }) => {
		await client.safeReply(interaction, 'Pong!');
	},
});

const ready = defineListener({
	id: 'ready',
	event: 'ready',
	once: true,
	execute: async (client) => {
		console.log(`Logged in as ${client.user.tag}`);
	},
});

const client = new Client({
	intents: [],
	components: [ping, ready],
});
```

## Exports

- Client
- ClientComponent, defineComponent
- ClientListener, defineListener
- handleInteractionPagination
- types