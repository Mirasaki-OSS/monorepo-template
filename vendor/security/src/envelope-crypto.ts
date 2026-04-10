import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { parseJson, stringifyJson } from '@md-oss/serdes';

export type CredentialEnvelope = {
	keyId: string;
	ciphertext: string;
	iv: string;
	authTag: string;
};

const DEFAULT_ALGORITHM = 'aes-256-gcm';
const DEFAULT_IV_SIZE_BYTES = 12;

const decodeBase64Key = (keyBase64: string): Buffer => {
	const key = Buffer.from(keyBase64, 'base64');
	if (key.length !== 32) {
		throw new Error('Invalid envelope key length: expected 32 bytes (base64).');
	}
	return key;
};

const serializePayload = (payload: unknown): string => {
	return stringifyJson(payload);
};

export const encryptEnvelope = ({
	payload,
	keyBase64,
	keyId,
}: {
	payload: unknown;
	keyBase64: string;
	keyId: string;
}): CredentialEnvelope => {
	const key = decodeBase64Key(keyBase64);
	const iv = randomBytes(DEFAULT_IV_SIZE_BYTES);
	const cipher = createCipheriv(DEFAULT_ALGORITHM, key, iv);

	const plaintext = serializePayload(payload);
	const encrypted = Buffer.concat([
		cipher.update(plaintext, 'utf8'),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();

	return {
		keyId,
		ciphertext: encrypted.toString('base64'),
		iv: iv.toString('base64'),
		authTag: authTag.toString('base64'),
	};
};

export const decryptEnvelope = <T>({
	envelope,
	keyBase64,
}: {
	envelope: CredentialEnvelope;
	keyBase64: string;
}): T => {
	const key = decodeBase64Key(keyBase64);
	const iv = Buffer.from(envelope.iv, 'base64');
	const authTag = Buffer.from(envelope.authTag, 'base64');
	const decipher = createDecipheriv(DEFAULT_ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);

	const ciphertext = Buffer.from(envelope.ciphertext, 'base64');
	const decrypted = Buffer.concat([
		decipher.update(ciphertext),
		decipher.final(),
	]);

	return parseJson<T>(decrypted.toString('utf8'));
};
