import crypto from 'node:crypto';
import { APIError } from '@md-oss/common/api/errors';
import { statusCodes } from '@md-oss/common/api/status-codes';

type SignedUrlSchema = {
	expires?: number | undefined;
	sig?: string | undefined;
	ref?: string | undefined;
};

const generateSignature = (
	secret: string,
	path: string,
	expires: number | null
): string => {
	const payload = expires === null ? path : `${path}:${expires}`;
	return crypto
		.createHmac('sha256', Buffer.from(secret, 'base64'))
		.update(payload)
		.digest('hex');
};

export function generateSignedUrl({
	secret,
	path,
	expires,
}: {
	secret: string;
	path: string;
	expires: Date | null;
}): {
	/**
	 * The signed URL.
	 */
	url: string;
	/**
	 * The expiration timestamp in UNIX format (seconds).
	 */
	expiresUnixTs: number | null;
	/**
	 * The signature used to verify the URL.
	 */
	sig: string;
} {
	const expiresTs = expires ? expires.valueOf() : null;
	const expiresTsUnix = expiresTs ? Math.floor(expiresTs / 1000) : null;
	const signature = generateSignature(secret, path, expiresTsUnix);

	let url = `${path}?sig=${signature}`;

	if (expiresTsUnix !== null) {
		url += `&expires=${expiresTsUnix}`;
	}

	return {
		url,
		expiresUnixTs: expiresTsUnix,
		sig: signature,
	};
}

export function verifySignedUrl({
	secret,
	path,
	expires,
	sig,
}: {
	/**
	 * The secret used to generate the signature.
	 */
	secret: string;
	/**
	 * The path of the signed URL.
	 */
	path: string;
	/**
	 * The expiration to verify against, in UNIX timestamp format (seconds).
	 */
	expires: number | null;
	/**
	 * The signature to verify.
	 */
	sig?: unknown;
}):
	| 'InvalidSignatureError'
	| 'ExpiredSignatureError'
	| {
			path: string;
			expires: number;
			sig: string;
	  } {
	const expectedSig = generateSignature(secret, path, expires);
	const now = Math.floor(Date.now() / 1000);
	const match =
		typeof sig !== 'string'
			? crypto.timingSafeEqual(
					Buffer.from(JSON.stringify(sig)),
					Buffer.from(expectedSig)
				)
			: sig === expectedSig;

	if (typeof sig !== 'string' || !match) {
		return 'InvalidSignatureError';
	}

	if (expires !== null && (typeof expires !== 'number' || expires < now)) {
		return 'ExpiredSignatureError';
	}

	return {
		path,
		expires: typeof expires === 'number' ? expires : now,
		sig: expectedSig,
	};
}

export type VerifySignedUrlFromRequestOptions = {
	/** The expected path to verify (must match what was originally signed) */
	expectedPath: string;
	/** The query object */
	query: SignedUrlSchema | undefined;
	/** The secret used to verify the signature */
	secret: string;
};

export type SignedAccessError =
	| 'MISSING_SIGNATURE'
	| 'INVALID_SIGNATURE'
	| 'EXPIRED_SIGNATURE';
export type SignedAccess =
	| {
			type: 'verified';
			sig: string;
			expires: number | null;
	  }
	| {
			type: 'invalid';
			error: SignedAccessError;
	  };

export function verifySignedUrlFromRequest({
	secret,
	expectedPath,
	query,
}: VerifySignedUrlFromRequestOptions): SignedAccess {
	const { expires, sig } = query || {};

	if (!sig) {
		return {
			type: 'invalid',
			error: 'MISSING_SIGNATURE',
		};
	}

	let result: ReturnType<typeof verifySignedUrl>;
	try {
		result = verifySignedUrl({
			secret,
			path: expectedPath,
			expires: expires ? Number(expires) : null,
			sig,
		});
	} catch {
		return {
			type: 'invalid',
			error: 'INVALID_SIGNATURE',
		};
	}

	if (typeof result === 'string') {
		return {
			type: 'invalid',
			error:
				result === 'InvalidSignatureError'
					? 'INVALID_SIGNATURE'
					: 'EXPIRED_SIGNATURE',
		};
	}

	return {
		type: 'verified',
		sig: result.sig,
		expires: result.expires ?? null,
	};
}

export function withSignedAccess<T>(
	signedAccess:
		| SignedAccess
		| {
				type: 'invalid';
				error: string;
		  },
	noSignedAccessCheck: () => Promise<true | T>
): Promise<true | T | APIError> {
	if (signedAccess.type === 'verified') {
		return Promise.resolve(true);
	}

	if (
		signedAccess.error === 'MISSING_SIGNATURE' ||
		(signedAccess.error !== 'INVALID_SIGNATURE' &&
			signedAccess.error !== 'EXPIRED_SIGNATURE')
	) {
		return noSignedAccessCheck();
	}

	return Promise.resolve(
		new APIError(statusCodes.FORBIDDEN, {
			code: signedAccess.error,
			message:
				signedAccess.error === 'INVALID_SIGNATURE'
					? 'The provided signature is invalid.'
					: 'The provided signature has expired.',
			details: {
				error: signedAccess.error,
			},
		})
	);
}
