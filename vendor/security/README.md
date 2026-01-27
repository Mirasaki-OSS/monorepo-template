# @md-oss/security

Cryptographic utilities for encryption, signed URLs, and secure streaming.

## Features

- **AES-256-GCM Encryption** - Secure string and buffer encryption with authentication
- **Signed URLs** - Generate and verify cryptographically signed URLs with optional expiration
- **Decryption Streams** - Stream-based decryption for large files with memory efficiency
- **Range Streaming** - Support for partial file reads

## Installation

```bash
pnpm add @md-oss/security
```

## Usage

### Encryption & Decryption

```typescript
import { generateKey, encrypt, decrypt } from '@md-oss/security';

// Generate a random encryption key (base64 encoded)
const key = generateKey(32); // 32 bytes for AES-256

// Encrypt a string
const encrypted = encrypt('Hello, World!', key);
console.log(encrypted); // Base64 encoded string

// Decrypt it back
const decrypted = decrypt(encrypted, key);
console.log(decrypted); // 'Hello, World!'

// Works with buffers too
const buffer = Buffer.from('Binary data');
const encryptedBuffer = encrypt(buffer, key);
const decryptedBuffer = decrypt(encryptedBuffer, key);
```

#### How It Works

- Uses **AES-256-GCM** (Galois/Counter Mode) for authenticated encryption
- Generates a random 12-byte IV for each encryption
- Automatically includes the IV and authentication tag in the encrypted output
- Returns base64-encoded strings for safe transport
- Provides authentication to prevent tampering

### Signed URLs

#### Generate Signed URLs

```typescript
import { generateSignedUrl } from '@md-oss/security';

const secret = 'your-base64-encoded-secret';
const path = '/api/files/document.pdf';
const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

const { url, expiresUnixTs, sig } = generateSignedUrl({
  secret,
  path,
  expires
});

console.log(url); // /api/files/document.pdf?sig=abc123&expires=1234567890

// URLs without expiration
const permanentUrl = generateSignedUrl({
  secret,
  path,
  expires: null
});
console.log(permanentUrl.url); // /api/files/document.pdf?sig=abc123
```

#### Verify Signed URLs

```typescript
import { verifySignedUrl } from '@md-oss/security';

const result = verifySignedUrl({
  secret,
  path: '/api/files/document.pdf',
  expires: 1234567890, // UNIX timestamp in seconds
  sig: 'abc123'
});

if (result === 'InvalidSignatureError') {
  console.log('Signature is invalid');
} else if (result === 'ExpiredSignatureError') {
  console.log('URL has expired');
} else {
  console.log('Verified:', result); // { path, expires, sig }
}
```

#### Verify from Request

```typescript
import { verifySignedUrlFromRequest } from '@md-oss/security';

// In your request handler
const signedAccess = verifySignedUrlFromRequest({
  secret: process.env.SIGNED_URL_SECRET || '',
  expectedPath: req.path,
  query: req.query
});

if (signedAccess.type === 'verified') {
  // URL signature is valid
  console.log('Access granted');
} else {
  // Handle invalid/expired signature
  console.log('Access denied:', signedAccess.error);
  // Possible errors: 'MISSING_SIGNATURE' | 'INVALID_SIGNATURE' | 'EXPIRED_SIGNATURE'
}
```

#### With Access Control

```typescript
import { withSignedAccess } from '@md-oss/security';

const result = await withSignedAccess(
  signedAccess,
  async () => {
    // This runs if signature is missing or invalid
    // Return true to continue without signature
    // Return error or data to handle differently
    return true; // Allow access without signature
  }
);

if (result instanceof APIError) {
  // Signature validation failed
  res.status(result.statusCode).json(result.body);
} else if (result === true) {
  // Access granted (either verified or allowed without)
  // Continue processing
}
```

### Decryption Streams

#### Basic Decryption Stream

```typescript
import { createDecryptionStream } from '@md-oss/security';

const decryptionKey = 'your-base64-encoded-key';
const filePath = '/path/to/encrypted/file';

const decryptedStream = createDecryptionStream(filePath, decryptionKey);

// Pipe to response for download
res.setHeader('Content-Type', 'application/octet-stream');
res.setHeader('Content-Disposition', 'attachment; filename="file.pdf"');
decryptedStream.pipe(res);

// Or save to file
import { createWriteStream } from 'node:fs';
const writeStream = createWriteStream('/path/to/decrypted/file');
decryptedStream.pipe(writeStream);

// Handle errors
decryptedStream.on('error', (err) => {
  console.error('Decryption error:', err);
});
```

#### Range Streaming

```typescript
import { streamWithRange } from '@md-oss/security';

// Stream specific byte range (e.g., for HTTP Range requests)
const start = 0;
const end = 1024 * 1024; // 1MB

const rangeStream = streamWithRange(filePath, start, end);
rangeStream.pipe(res);
```

## Security Best Practices

### Key Management

```typescript
// Generate secure random keys
const encryptionKey = generateKey(32); // 32 bytes for AES-256
const signingSecret = generateKey(32);

// Store securely (e.g., environment variables, KMS)
process.env.ENCRYPTION_KEY = encryptionKey;
process.env.SIGNED_URL_SECRET = signingSecret;

// Never hardcode keys in source code
// Rotate keys periodically
// Use different keys for different purposes
```

### Signed URL Best Practices

```typescript
// Always set expiration times
const shortLivedUrl = generateSignedUrl({
  secret,
  path,
  expires: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
});

// Use different secrets for different purposes
const downloadSecret = process.env.DOWNLOAD_SIGNED_URL_SECRET;
const uploadSecret = process.env.UPLOAD_SIGNED_URL_SECRET;

// Include path in signature to prevent URL manipulation
// Verify path matches expected value
const expectedPath = '/api/files/user-123/document.pdf';
const userProvidedPath = req.query.path;

if (expectedPath !== userProvidedPath) {
  throw new Error('Path mismatch');
}
```

### Encryption Best Practices

```typescript
// Use strong keys
const key = generateKey(32); // 32 bytes = 256 bits for AES-256

// Each encryption generates a new random IV
const data1 = encrypt('secret', key); // Different each time
const data2 = encrypt('secret', key);
// data1 !== data2, both decrypt to 'secret'

// Verify authenticity before decrypting
// AES-GCM provides authentication automatically

// Don't reuse keys across different purposes
const userDataKey = generateKey(32);
const sessionDataKey = generateKey(32);
```

## Types

```typescript
import type {
  SignedUrlSchema,
  VerifySignedUrlFromRequestOptions,
  SignedAccessError,
  SignedAccess
} from '@md-oss/security';
```

## Error Handling

```typescript
import { createDecryptionStream } from '@md-oss/security';

const stream = createDecryptionStream(filePath, key);

stream.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('File not found');
  } else if (err.code === 'ERR_OSSL_EVP_BAD_DECRYPT') {
    console.error('Decryption failed - wrong key or corrupted data');
  } else {
    console.error('Unknown error:', err);
  }
});

stream.pipe(destination);
```

## Performance Considerations

- **Encryption/Decryption**: O(n) where n is data size
- **Stream Processing**: Memory-efficient for large files (64KB chunks by default)
- **Signed URLs**: O(1) - constant time verification
- **Timing-safe Comparison**: Uses `crypto.timingSafeEqual` to prevent timing attacks

## API Reference

### Encryption

- `generateKey(length?: number): string` - Generate base64-encoded random key
- `encrypt<T>(input: T, key: string): T` - Encrypt string or buffer
- `decrypt<T>(input: T, key: string): T` - Decrypt string or buffer

### Signed URLs

- `generateSignedUrl(options): { url, expiresUnixTs, sig }`
- `verifySignedUrl(options): string | { path, expires, sig }`
- `verifySignedUrlFromRequest(options): SignedAccess`
- `withSignedAccess(access, callback): Promise`

### Streams

- `createDecryptionStream(filePath, key): PassThrough`
- `streamWithRange(filePath, start, end): PassThrough`
