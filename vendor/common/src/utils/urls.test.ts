import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { createUrlBuilder, getEnvUrl } from './urls';

const originalNodeEnv = process.env.NODE_ENV;
const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const DEFAULT_DEV_BASE_URL = 'http://localhost:3000';

const setNodeEnv = (value: string | undefined) => {
	Object.defineProperty(process.env, 'NODE_ENV', {
		configurable: true,
		enumerable: true,
		writable: true,
		value,
	});
};

afterEach(() => {
	setNodeEnv(originalNodeEnv);

	if (originalBaseUrl === undefined) {
		delete process.env.NEXT_PUBLIC_BASE_URL;
		return;
	}

	process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
});

describe('getEnvUrl', () => {
	it('defaults to localhost in development when unset', () => {
		setNodeEnv('development');
		delete process.env.NEXT_PUBLIC_BASE_URL;
		const baseUrl: string = getEnvUrl(
			'NEXT_PUBLIC_BASE_URL',
			DEFAULT_DEV_BASE_URL
		);

		assert.equal(baseUrl, DEFAULT_DEV_BASE_URL);
	});

	it('returns null in development when unset and no default is provided', () => {
		setNodeEnv('development');
		delete process.env.NEXT_PUBLIC_BASE_URL;

		assert.equal(getEnvUrl('NEXT_PUBLIC_BASE_URL'), null);
	});

	it('throws in production when unset', () => {
		setNodeEnv('production');
		delete process.env.NEXT_PUBLIC_BASE_URL;

		assert.throws(
			() => getEnvUrl('NEXT_PUBLIC_BASE_URL'),
			/NEXT_PUBLIC_BASE_URL must be set/
		);
	});

	it('throws in production for non-https urls', () => {
		setNodeEnv('production');
		process.env.NEXT_PUBLIC_BASE_URL = 'http://example.com';

		assert.throws(() => getEnvUrl('NEXT_PUBLIC_BASE_URL'), /must use HTTPS/);
	});

	it('builds app urls from the validated base url', () => {
		setNodeEnv('production');
		process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com/';
		const baseUrl = getEnvUrl('NEXT_PUBLIC_BASE_URL');

		assert.ok(baseUrl);

		assert.equal(
			createUrlBuilder(baseUrl)('/onboarding/complete'),
			'https://example.com/onboarding/complete'
		);
	});

	it('throws for an empty default value', () => {
		setNodeEnv('development');
		delete process.env.NEXT_PUBLIC_BASE_URL;

		assert.throws(
			() => getEnvUrl('NEXT_PUBLIC_BASE_URL', '   '),
			/defaultValue for getEnvUrl must be a valid absolute URL/
		);
	});
});
