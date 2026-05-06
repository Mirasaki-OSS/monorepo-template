import type { SerializedJson } from '@md-oss/serdes/json';

import type { UserSelect } from '../types';
import type { AccountSelect } from './accounts';
import type { SessionSelect } from './sessions';
import type { VerificationSelect } from './verifications';

export type APIAccount = SerializedJson<AccountSelect>;
export type APISession = SerializedJson<SessionSelect>;
export type APIUser = SerializedJson<UserSelect>;
export type APIVerification = SerializedJson<VerificationSelect>;
