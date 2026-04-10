import { decode, encode } from '@msgpack/msgpack';

const toUint8Array = (value: Uint8Array | ArrayBuffer): Uint8Array =>
	value instanceof Uint8Array ? value : new Uint8Array(value);

export const parseMessagePack = <T = unknown>(
	value: Uint8Array | ArrayBuffer
): T => decode(toUint8Array(value)) as T;

export const stringifyMessagePack = (value: unknown): Uint8Array =>
	encode(value);
