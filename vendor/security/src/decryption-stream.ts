import { createDecipheriv } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { PassThrough } from 'node:stream';

export function createDecryptionStream(
	filePath: string,
	decryptionKey: string
): PassThrough {
	const readStream = createReadStream(filePath, { highWaterMark: 64 * 1024 });

	let iv: Buffer;
	let authTag: Buffer;

	const passthrough = new PassThrough();

	readStream.on('error', (error) => {
		passthrough.emit('error', error);
	});

	readStream.on('end', () => {
		passthrough.end();
	});

	readStream.once('readable', () => {
		const header = readStream.read(28);
		if (!header) return;

		iv = header.subarray(0, 12);
		authTag = header.subarray(12, 28);

		const decipher = createDecipheriv(
			'aes-256-gcm',
			Buffer.from(decryptionKey, 'base64'),
			iv
		);
		decipher.setAuthTag(authTag);

		readStream.pipe(decipher).pipe(passthrough);
	});

	return passthrough;
}

export function streamWithRange(
	filePath: string,
	start: number,
	end: number
): PassThrough {
	const readStream = createReadStream(filePath, {
		start,
		end,
		highWaterMark: 64 * 1024,
	});
	const passthrough = new PassThrough();

	readStream.on('error', (error) => {
		passthrough.emit('error', error);
	});

	readStream.on('end', () => {
		passthrough.end();
	});

	readStream.pipe(passthrough);

	return passthrough;
}
