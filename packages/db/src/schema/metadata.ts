import { sql } from 'drizzle-orm';
import { jsonb } from 'drizzle-orm/pg-core';

type MetadataShape = Record<string, unknown>;

type MetadataColumns<
	TClient extends MetadataShape,
	TClientReadonly extends MetadataShape,
	TServer extends MetadataShape,
> = {
	clientMetadata: TClient;
	clientReadonlyMetadata: TClientReadonly;
	serverMetadata: TServer;
};

type ClientVisibleMetadata<
	TClient extends MetadataShape,
	TClientReadonly extends MetadataShape,
> = Pick<
	MetadataColumns<TClient, TClientReadonly, Record<string, never>>,
	'clientMetadata' | 'clientReadonlyMetadata'
>;

function metadataColumns<
	TClient extends MetadataShape = Record<string, never>,
	TClientReadonly extends MetadataShape = Record<string, never>,
	TServer extends MetadataShape = Record<string, never>,
>() {
	return {
		clientMetadata: jsonb('client_metadata')
			.$type<TClient>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		clientReadonlyMetadata: jsonb('client_readonly_metadata')
			.$type<TClientReadonly>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		serverMetadata: jsonb('server_metadata')
			.$type<TServer>()
			.notNull()
			.default(sql`'{}'::jsonb`),
	};
}

function pickClientMetadata<
	TClient extends MetadataShape,
	TClientReadonly extends MetadataShape,
	TServer extends MetadataShape,
>(
	record: MetadataColumns<TClient, TClientReadonly, TServer>
): ClientVisibleMetadata<TClient, TClientReadonly> {
	return {
		clientMetadata: record.clientMetadata,
		clientReadonlyMetadata: record.clientReadonlyMetadata,
	};
}

export {
	type ClientVisibleMetadata,
	type MetadataColumns,
	type MetadataShape,
	metadataColumns,
	pickClientMetadata,
};
