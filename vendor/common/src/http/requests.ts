import type { ParsedQs } from 'qs';

export interface ParamsDictionary {
	[key: string]: string | string[];
	[key: number]: string;
}
export interface ParamsFlatDictionary {
	[key: string | number]: string;
}
export type Params =
	| Record<string, string | string[]>
	| ParamsDictionary
	| ParamsFlatDictionary;

export interface MinimalRequest {
	method: string;
	protocol: string;
	headers: Record<string, string | string[] | undefined>;
	get(header: string): string | undefined;
	originalUrl?: string;
	params?: Params;
	query?: string | ParsedQs | (string | ParsedQs)[] | undefined;
	body?: Record<string, unknown>;
	ip: string | undefined;
	connection?: {
		remoteAddress?: string;
	};
}

export interface MinimalResponse {
	locals: Record<string, unknown>;
	statusCode: number;
	setHeader(name: string, value: string): void;
	status(code: number): MinimalResponse;
	send(...args: unknown[]): void;
	json(data: unknown): void;
	end(...args: unknown[]): void;
	write(...args: unknown[]): void;
	getHeader(name: string): string | number | string[] | undefined;
}

export type MinimalNextFunction = (err?: unknown) => void;

export type MinimalRequestHandler = (
	req: MinimalRequest,
	res: MinimalResponse,
	next: MinimalNextFunction
) => Promise<void> | void;

export type MinimalRequestHandlerWithContext<TContext> = (
	req: MinimalRequest,
	res: MinimalResponse,
	next: MinimalNextFunction,
	context: TContext
) => Promise<void> | void;
