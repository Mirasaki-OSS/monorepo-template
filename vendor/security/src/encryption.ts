import crypto from 'node:crypto';

export function generateKey(length = 32): string {
	return crypto.randomBytes(length).toString('hex');
}

export function encrypt<T extends string | Buffer>(
	input: T,
	encryptionKey: string
): T {
	const iv = crypto.randomBytes(12);
	const key = Buffer.from(encryptionKey, 'base64');
	const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

	const bufferInput =
		typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
	const encrypted = Buffer.concat([cipher.update(bufferInput), cipher.final()]);
	const authTag = cipher.getAuthTag();

	const output = Buffer.concat([iv, authTag, encrypted]);

	return typeof input === 'string'
		? (output.toString('base64') as T)
		: (output as T);
}

export function decrypt<T extends string | Buffer>(
	input: T,
	decryptionKey: string
): T {
	const encryptedBuffer =
		typeof input === 'string'
			? Buffer.from(input, 'base64')
			: (input as Buffer);

	const iv = encryptedBuffer.subarray(0, 12);
	const authTag = encryptedBuffer.subarray(12, 28);
	const encryptedData = encryptedBuffer.subarray(28);

	const key = Buffer.from(decryptionKey, 'base64');
	const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
	decipher.setAuthTag(authTag);

	const decrypted = Buffer.concat([
		decipher.update(encryptedData),
		decipher.final(),
	]);

	return typeof input === 'string'
		? (decrypted.toString('utf8') as T)
		: (decrypted as T);
}
