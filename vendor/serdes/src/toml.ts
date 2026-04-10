import { parse, stringify } from 'smol-toml';

export const parseToml = <T = unknown>(value: string): T => parse(value) as T;

export const stringifyToml = (value: unknown): string => stringify(value);
