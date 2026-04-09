const normalizeUrl = (value: string) => value.trim().replace(/\/+$/, '');

const normalizePath = (path: string) => {
	if (!path) {
		return '';
	}

	return path.startsWith('/') ? path : `/${path}`;
};

const validateProductionUrl = (value: string, message: string) => {
	const parsed = new URL(value);

	if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
		throw new Error(message);
	}

	return normalizeUrl(parsed.toString());
};

function getEnvUrl(envVar: string): string | null;
function getEnvUrl(envVar: string, defaultValue: string): string;
function getEnvUrl(envVar: string, defaultValue?: string): string | null;
function getEnvUrl(envVar: string, defaultValue?: string): string | null {
	const envValue = process.env[envVar]?.trim();
	const normalizedDefaultValue = defaultValue?.trim();
	const configuredBaseUrl = envValue || normalizedDefaultValue;

	if (configuredBaseUrl) {
		const validationMessage = envValue
			? `${envVar} must use HTTPS in production.`
			: 'The defaultValue for getEnvUrl must use HTTPS in production.';

		return validateProductionUrl(configuredBaseUrl, validationMessage);
	}

	if (defaultValue !== undefined) {
		throw new Error(
			`The defaultValue for getEnvUrl must be a valid absolute URL. Received an empty value.`
		);
	}

	if (process.env.NODE_ENV === 'production') {
		throw new Error(`${envVar} must be set in production.`);
	}

	return null;
}

const createUrlBuilder =
	(baseUrl: string | null | undefined) => (path: string) => {
		const normalizedBase = baseUrl ? normalizeUrl(baseUrl) : '';
		const normalizedPath = normalizePath(path);
		return normalizedBase
			? `${normalizedBase}${normalizedPath}`
			: normalizedPath;
	};

export {
	createUrlBuilder,
	getEnvUrl,
	normalizePath,
	normalizeUrl,
	validateProductionUrl,
};
