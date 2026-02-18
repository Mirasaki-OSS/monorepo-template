/**
 * MIME type category
 */
type MimeKind = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'ARCHIVE' | 'OTHER';

/**
 * MIME type category including SAFE (all safe types combined)
 */
type MimeKindWithSafe = MimeKind | 'SAFE';

/**
 * List of common image MIME types
 */
const imageMimeTypes = [
	'image/png',
	'image/jpeg',
	'image/webp',
	'image/gif',
	'image/bmp',
	'image/svg+xml',
	'image/x-icon',
	'image/tiff',
	'image/heic',
	'image/avif',
	'image/apng',
	'image/jpg',
] as const;

/**
 * List of common video MIME types
 */
const videoMimeTypes = [
	'video/mp4',
	'video/webm',
	'video/ogg',
	'video/avi',
	'video/mpeg',
	'video/quicktime',
	'video/x-msvideo',
	'video/x-matroska',
	'video/x-flv',
	'video/x-ms-wmv',
	'video/x-mpeg',
	'video/x-ms-asf',
	'video/x-ms-wmx',
	'video/x-ms-wvx',
	'video/x-matroska',
	'video/x-flash-video',
] as const;

/**
 * List of common audio MIME types
 */
const audioMimeTypes = [
	'audio/mpeg',
	'audio/wav',
	'audio/ogg',
	'audio/aac',
	'audio/flac',
	'audio/mp3',
	'audio/x-wav',
	'audio/x-aiff',
	'audio/x-m4a',
	'audio/x-ms-wma',
	'audio/x-ms-wax',
	'audio/x-matroska',
	'audio/x-flac',
	'audio/x-aac',
] as const;

/**
 * List of common document MIME types
 */
const documentMimeTypes = [
	'text/plain',
	'text/csv',
	'text/rtf',
	'text/markdown',
	'text/x-markdown',
	'text/x-log',
	'text/x-ini',
	'text/x-yaml',
	'text/xml',
	'application/x-yaml',
	'application/xml',
	'application/rtf',
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.oasis.opendocument.text',
	'application/vnd.oasis.opendocument.spreadsheet',
] as const;

/**
 * List of common archive/compression MIME types
 */
const archiveMimeTypes = [
	'application/zip',
	'application/x-7z-compressed',
	'application/x-rar-compressed',
	'application/x-tar',
	'application/gzip',
	'application/x-bzip2',
	'application/x-xz',
	'application/x-compress',
	'application/x-archive',
	'application/x-zip-compressed',
	'application/x-rar',
	'application/x-gzip',
	'application/x-bzip',
] as const;

/**
 * List of web asset MIME types (HTML, CSS, JS, fonts, etc.)
 */
const webAssetTypes = [
	'text/html',
	'text/css',
	'text/javascript',
	'application/json',
	'application/xml',
	'application/x-javascript',
	'application/x-web-app-manifest+json',
	'application/x-font-woff',
	'application/x-font-woff2',
	'image/svg+xml',
	'image/x-icon',
] as const;

/**
 * Combined list of all safe MIME types
 */
const safeMimeTypes = [
	...imageMimeTypes,
	...videoMimeTypes,
	...audioMimeTypes,
	...documentMimeTypes,
	...archiveMimeTypes,
	...webAssetTypes,
] as Array<
	| (typeof imageMimeTypes)[number]
	| (typeof videoMimeTypes)[number]
	| (typeof audioMimeTypes)[number]
	| (typeof documentMimeTypes)[number]
	| (typeof archiveMimeTypes)[number]
	| (typeof webAssetTypes)[number]
>;

/**
 * Map of MIME kind to list of MIME types
 */
const mimeTypeMap: Record<MimeKindWithSafe, readonly string[]> = {
	IMAGE: imageMimeTypes,
	VIDEO: videoMimeTypes,
	AUDIO: audioMimeTypes,
	DOCUMENT: documentMimeTypes,
	ARCHIVE: archiveMimeTypes,
	SAFE: safeMimeTypes,
	OTHER: [],
};

/**
 * Returns a comma-separated accept string for input elements based on the specified kind
 * @param kind - The type of MIME kind to get the accept string for
 * @returns Comma-separated MIME types string
 * @example getInputAccept('IMAGE') // "image/png,image/jpeg,..."
 */
const getInputAccept = (kind: MimeKindWithSafe = 'SAFE'): string => {
	return mimeTypeMap[kind].join(',');
};

/**
 * Check if a MIME type is allowed for a given kind
 * @param mimeType - MIME type to check
 * @param kind - The type of MIME kind to check against (default: 'SAFE')
 * @returns True if MIME type is allowed
 * @example isAllowedMimeType('image/png', 'IMAGE') // true
 * @example isAllowedMimeType('application/exe', 'SAFE') // false
 */
const isAllowedMimeType = (
	mimeType: string,
	kind: MimeKindWithSafe = 'SAFE'
): boolean => {
	if (!mimeType || typeof mimeType !== 'string') {
		return false;
	}

	const lowerMimeType = mimeType.toLowerCase().split(';')[0].trim();

	return mimeTypeMap[kind].includes(lowerMimeType);
};

/**
 * List of MIME types that should use inline Content-Disposition
 */
const inlineContentDispositionMimeTypes = [
	'text/plain',
	'text/xml',
	'application/json',
	'application/pdf',
] as const;

/**
 * Check if a MIME type should use inline Content-Disposition
 * @param mimeType - MIME type to check
 * @returns True if should be inline
 * @example isInlineContentDisposition('image/png') // true
 * @example isInlineContentDisposition('application/zip') // false
 */
const isInlineContentDisposition = (mimeType: string): boolean => {
	const lowerMimeType = mimeType.toLowerCase().split(';')[0].trim();
	return (
		inlineContentDispositionMimeTypes.includes(
			lowerMimeType as (typeof inlineContentDispositionMimeTypes)[number]
		) ||
		lowerMimeType.startsWith('image/') ||
		lowerMimeType.startsWith('video/') ||
		lowerMimeType.startsWith('audio/')
	);
};

/**
 * Resolve a MIME type to its category
 * @param _mimeType - MIME type to resolve
 * @returns The MIME kind category
 * @example mimeTypeResolver('image/png') // 'IMAGE'
 * @example mimeTypeResolver('video/mp4') // 'VIDEO'
 */
const mimeTypeResolver = (_mimeType: string): MimeKind => {
	const mimeType = _mimeType.toLowerCase().split(';')[0].trim();

	if (mimeType.startsWith('image/')) {
		return 'IMAGE';
	} else if (mimeType.startsWith('video/')) {
		return 'VIDEO';
	} else if (mimeType.startsWith('audio/')) {
		return 'AUDIO';
	} else if (
		documentMimeTypes.includes(mimeType as (typeof documentMimeTypes)[number])
	) {
		return 'DOCUMENT';
	} else if (
		archiveMimeTypes.includes(mimeType as (typeof archiveMimeTypes)[number])
	) {
		return 'ARCHIVE';
	} else {
		return 'OTHER';
	}
};

export {
	type MimeKind,
	type MimeKindWithSafe,
	imageMimeTypes,
	videoMimeTypes,
	audioMimeTypes,
	documentMimeTypes,
	archiveMimeTypes,
	safeMimeTypes,
	mimeTypeMap,
	getInputAccept,
	isAllowedMimeType,
	isInlineContentDisposition,
	mimeTypeResolver,
	inlineContentDispositionMimeTypes,
};
