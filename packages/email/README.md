# @md-oss/email

Transactional email utilities for auth and account flows using React Email templates from `@md-oss/design-system` and delivery via Resend.

## What This Package Provides

- Prebuilt sender methods for common auth/account emails
- Shared typed `emailService` API for application code
- Re-exported `VerificationEmail` template component for custom flows
- Environment validation for `RESEND_API_KEY` and `RESEND_FROM_EMAIL`

## Included Senders

- `sendDeleteAccountVerificationEmail`
- `sendEmailChangedEmail`
- `sendEmailChangeVerificationEmail`
- `sendEmailVerificationEmail`
- `sendMagicLinkEmail`
- `sendNewDeviceEmail`
- `sendOtpEmail`
- `sendPasswordChangedEmail`
- `sendResetPasswordEmail`

## Environment Variables

- `RESEND_API_KEY`: Resend API key used by the internal `Resend` client
- `RESEND_FROM_EMAIL`: Sender address used in `from`

## Usage

```ts
import { emailService } from '@md-oss/email';

await emailService.sendEmailVerificationEmail(
	{
		to: {
			email: 'user@example.com',
			name: 'Mira',
		},
	},
	{
		verificationUrl: 'https://example.com/verify?token=abc',
		appName: 'My App',
	}
);
```

Magic link emails accept a nullable `to.name`:

```ts
import { emailService } from '@md-oss/email';

await emailService.sendMagicLinkEmail(
	{
		to: {
			email: 'user@example.com',
			name: null,
		},
	},
	{
		magicLink: 'https://example.com/sign-in?token=abc',
		appName: 'My App',
	}
);
```

## Template Access

You can import the shared verification base template directly:

```ts
import {
	VerificationEmail,
	type VerificationEmailProps,
} from '@md-oss/email';
```

## API Surface

- `emailService`: object containing all sender functions
- `resend`: configured `Resend` instance
- `serverEnv`: runtime env validator for email variables
- `EmailProps`, `EmailPropsTo`: shared recipient types
- `EmailResult`: resolved type of `resend.emails.send`