import type z from 'zod/v4';

export type EndpointDefinition<
	P = unknown,
	Resp = unknown,
	Q extends z.ZodType | undefined = z.ZodType | undefined,
	B extends z.ZodType | undefined = z.ZodType | undefined,
> = {
	permissions: P;
	response?: Resp;
	query?: Q;
	body?: B;
};

/**
 * Generic route registry that can be used to create type-safe API clients.
 * External packages can define their own route registries using this type.
 *
 * @example
 * ```typescript
 * const myRoutes = {
 *   "/users/:id": {
 *     params: z.object({ id: z.string() }),
 *     endpoints: {
 *       GET: {
 *         response: {} as User,
 *         permissions: null,
 *       },
 *     },
 *   },
 * } as const satisfies RouteRegistry;
 * ```
 */
export type RouteRegistry<
	Permissions = unknown,
	Params extends z.ZodType | undefined = z.ZodType | undefined,
> = {
	[path: string]: {
		params?: Params;
		endpoints: {
			[method: string]: EndpointDefinition<Permissions>;
		};
	};
};

type ExtractPermissionType<T extends RouteRegistry> =
	T extends RouteRegistry<infer P> ? P : never;

// Helper to extract string keys from RouteRegistry (fixes TypeScript's keyof broadening to string | number | symbol)
export type RouteKeys<T extends RouteRegistry> = Extract<keyof T, string>;
export type MethodKeys<
	T extends RouteRegistry,
	R extends RouteKeys<T>,
> = Extract<keyof T[R]['endpoints'], string>;

/**
 * Infer the API type from a route registry.
 * This is used internally by the client factory.
 */
export type InferApi<T extends RouteRegistry> = {
	[R in RouteKeys<T>]: {
		params: T[R]['params'] extends z.ZodType
			? z.infer<T[R]['params']>
			: undefined;
		endpoints: {
			[M in MethodKeys<T, R>]: {
				permissions: T[R]['endpoints'][M] extends { permissions: infer P }
					? P extends ExtractPermissionType<T>
						? P
						: ExtractPermissionType<T>
					: ExtractPermissionType<T>;
				response: T[R]['endpoints'][M] extends { response: infer Resp }
					? Resp
					: undefined;
				query: T[R]['endpoints'][M] extends { query: infer Q }
					? Q extends z.ZodType
						? z.output<Q>
						: undefined
					: undefined;
				body: T[R]['endpoints'][M] extends { body: infer B }
					? B extends z.ZodType
						? z.output<B>
						: undefined
					: undefined;
			};
		};
	};
};

export type PrefixRoutes<
	Prefix extends string,
	T extends Record<string, unknown>,
> = {
	[K in keyof T as K extends '/' ? Prefix : `${Prefix}${K & string}`]: T[K];
};

export function prefixRoutes<
	P extends string,
	T extends Record<string, unknown>,
>(prefix: P, routes: T): PrefixRoutes<P, T> {
	return Object.fromEntries(
		Object.entries(routes).map(([key, value]) => {
			const prefixedKey = key === '/' ? prefix : `${prefix}${key}`;
			return [prefixedKey, value];
		})
	) as PrefixRoutes<P, T>;
}
