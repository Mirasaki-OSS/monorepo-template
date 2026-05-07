import type { InferSelectModel, Table } from 'drizzle-orm';
import type {
	BuildRefine,
	CoerceOptions,
	NoUnknownKeys,
} from 'drizzle-orm/zod';

type SchemaRefinements<
	TTable extends Table,
	TCoerce extends CoerceOptions = undefined,
	TRefine extends BuildRefine<TTable['_']['columns'], TCoerce> = BuildRefine<
		TTable['_']['columns'],
		TCoerce
	>,
> = NoUnknownKeys<TRefine, InferSelectModel<TTable>>;

export type { SchemaRefinements };
