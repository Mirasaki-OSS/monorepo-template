import type z from 'zod/v4';
import { normalizedString } from './strings';

// ULID / UUID / Snowflake friendly
const uniqueIdentifier = normalizedString().min(8).max(64);
type UniqueIdentifier = z.infer<typeof uniqueIdentifier>;

export { type UniqueIdentifier, uniqueIdentifier };
