import { decode, encode } from 'cbor-x';

const toUint8Array = (value: Uint8Array | ArrayBuffer): Uint8Array =>
	value instanceof Uint8Array ? value : new Uint8Array(value);

export const parseCbor = <T = unknown>(value: Uint8Array | ArrayBuffer): T =>
	decode(toUint8Array(value)) as T;

export const stringifyCbor = (value: unknown): Uint8Array => encode(value);
