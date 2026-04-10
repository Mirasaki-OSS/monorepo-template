import { parseCbor, stringifyCbor } from './cbor';
import { parseJson, stringifyJson } from './json';
import { parseMessagePack, stringifyMessagePack } from './messagepack';
import { parseToml, stringifyToml } from './toml';
import { parseYaml, stringifyYaml } from './yaml';

export { parseCbor, stringifyCbor } from './cbor';
export {
	bigIntSerializationHelper,
	type JsonParseOptions,
	type JsonPrimitive,
	type JsonStringifyOptions,
	type JsonValueLike,
	parseJson,
	type SerializedJson,
	serializeJson,
	stableSerializeForCacheKey,
	stringifyJson,
} from './json';
export { parseMessagePack, stringifyMessagePack } from './messagepack';
export { parseToml, stringifyToml } from './toml';
export { parseYaml, stringifyYaml } from './yaml';

export type SerdesFormat =
	| 'json'
	| 'yaml'
	| 'toml'
	| 'messagepack'
	| 'msgpack'
	| 'cbor';

const ensureTextPayload = (format: SerdesFormat, payload: unknown): string => {
	if (typeof payload !== 'string') {
		throw new TypeError(`Format ${format} requires a string payload`);
	}
	return payload;
};

const ensureBinaryPayload = (
	format: SerdesFormat,
	payload: unknown
): Uint8Array | ArrayBuffer => {
	if (payload instanceof Uint8Array || payload instanceof ArrayBuffer) {
		return payload;
	}
	throw new TypeError(
		`Format ${format} requires Uint8Array or ArrayBuffer payload`
	);
};

export const serialize = (
	format: SerdesFormat,
	value: unknown
): string | Uint8Array => {
	switch (format) {
		case 'json':
			return stringifyJson(value);
		case 'yaml':
			return stringifyYaml(value);
		case 'toml':
			return stringifyToml(value);
		case 'messagepack':
		case 'msgpack':
			return stringifyMessagePack(value);
		case 'cbor':
			return stringifyCbor(value);
		default:
			throw new Error(`Unsupported format: ${String(format)}`);
	}
};

export const deserialize = <T = unknown>(
	format: SerdesFormat,
	payload: string | Uint8Array | ArrayBuffer
): T => {
	switch (format) {
		case 'json':
			return parseJson<T>(ensureTextPayload(format, payload));
		case 'yaml':
			return parseYaml<T>(ensureTextPayload(format, payload));
		case 'toml':
			return parseToml<T>(ensureTextPayload(format, payload));
		case 'messagepack':
		case 'msgpack':
			return parseMessagePack<T>(ensureBinaryPayload(format, payload));
		case 'cbor':
			return parseCbor<T>(ensureBinaryPayload(format, payload));
		default:
			throw new Error(`Unsupported format: ${String(format)}`);
	}
};
