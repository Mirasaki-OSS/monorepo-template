import { parse, stringify } from 'yaml';

export const parseYaml = <T = unknown>(value: string): T => parse(value) as T;

export const stringifyYaml = (value: unknown): string => stringify(value);
