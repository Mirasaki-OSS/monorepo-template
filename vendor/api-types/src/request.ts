import type { InferApi, RouteRegistry } from './types';

type RequestOptions<
	Registry extends RouteRegistry,
	API extends InferApi<Registry>,
	TPath extends Extract<keyof Registry, string>,
	TMethod extends Extract<keyof Registry[TPath]['endpoints'], string>,
> = {
	method: TMethod;
} & (API[TPath]['params'] extends undefined
	? { params?: never }
	: { params: API[TPath]['params'] }) &
	(API[TPath]['endpoints'][TMethod]['query'] extends undefined
		? { query?: never }
		: { query: API[TPath]['endpoints'][TMethod]['query'] }) &
	(API[TPath]['endpoints'][TMethod]['body'] extends undefined
		? { body?: never }
		: { body: API[TPath]['endpoints'][TMethod]['body'] });

type ExtractParams<
	Registry extends RouteRegistry,
	API extends InferApi<Registry>,
	TPath extends Extract<keyof Registry, string>,
> = API[TPath]['params'] extends undefined
	? object
	: { params: API[TPath]['params'] };

type ExtractQuery<
	Registry extends RouteRegistry,
	API extends InferApi<Registry>,
	TPath extends Extract<keyof Registry, string>,
	TMethod extends Extract<keyof Registry[TPath]['endpoints'], string>,
> = API[TPath]['endpoints'][TMethod]['query'] extends undefined
	? object
	: { query: API[TPath]['endpoints'][TMethod]['query'] };

type ExtractBody<
	Registry extends RouteRegistry,
	API extends InferApi<Registry>,
	TPath extends Extract<keyof Registry, string>,
	TMethod extends Extract<keyof Registry[TPath]['endpoints'], string>,
> = API[TPath]['endpoints'][TMethod]['body'] extends undefined
	? object
	: { body: API[TPath]['endpoints'][TMethod]['body'] };

type ExtractResolvedContext<
	Registry extends RouteRegistry,
	API extends InferApi<Registry>,
	TPath extends Extract<keyof Registry, string>,
	TMethod extends Extract<keyof Registry[TPath]['endpoints'], string>,
> = ExtractParams<Registry, API, TPath> &
	ExtractQuery<Registry, API, TPath, TMethod> &
	ExtractBody<Registry, API, TPath, TMethod>;

export type { RequestOptions, ExtractResolvedContext };
