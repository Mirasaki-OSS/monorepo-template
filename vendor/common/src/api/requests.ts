import type { ParsedQs } from 'qs';

interface ParamsDictionary {
	[key: string]: string | string[];
	[key: number]: string;
}
interface ParamsFlatDictionary {
	[key: string | number]: string;
}
type Params =
	| Record<string, string | string[]>
	| ParamsDictionary
	| ParamsFlatDictionary;

interface MinimalRequest {
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

interface MinimalResponse {
	locals: Record<string, unknown>;
	statusCode: number;
	setHeader(name: string, value: string): void;
	status(code: number): MinimalResponse;
	send(...args: unknown[]): void;
	json(data: unknown): void;
	end(...args: unknown[]): void;
}

type MinimalNextFunction = (err?: unknown) => void;

type MinimalRequestHandler = (
	req: MinimalRequest,
	res: MinimalResponse,
	next: MinimalNextFunction
) => Promise<void> | void;

export type {
	MinimalRequest,
	MinimalResponse,
	MinimalNextFunction,
	MinimalRequestHandler,
	Params,
	ParamsDictionary,
	ParamsFlatDictionary,
};
