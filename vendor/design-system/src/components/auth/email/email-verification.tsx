import { cn } from '@md-oss/design-system/lib/utils';
import { Link, Text } from '@react-email/components';
import type { ReactNode } from 'react';
import type { EmailClassNames, EmailColors } from './email-styles';
import { VerificationEmail } from './verification-email-base';

const emailVerificationEmailLocalization = {
	VERIFY_YOUR_EMAIL_ADDRESS: 'Verify your email address',
	LOGO: 'Logo',
	CLICK_BUTTON_TO_VERIFY_EMAIL:
		'Click the button below to verify your email address {emailAddress} for your {appName} account.',
	VERIFY_EMAIL_ADDRESS: 'Verify email address',
	OR_COPY_AND_PASTE_URL: 'Or copy and paste this URL into your browser:',
	THIS_LINK_EXPIRES_IN_MINUTES:
		'This link expires in {expirationMinutes} minutes.',
	EMAIL_SENT_BY: 'Email sent by {appName}.',
	IF_YOU_DIDNT_REQUEST_THIS_EMAIL:
		"If you didn't request this email, you can safely ignore it. Someone else might have typed your email address by mistake.",
	POWERED_BY_BETTER_AUTH: 'Powered by {betterAuth}',
};

/**
 * Localization strings for the EmailVerificationEmail component.
 *
 * Contains all text content used in the email verification email template.
 */
export type EmailVerificationEmailLocalization =
	typeof emailVerificationEmailLocalization;

/**
 * Props for the EmailVerificationEmail component.
 */
export interface EmailVerificationEmailProps {
	/** Verification URL that users must click to verify their email */
	url: string;
	/** Email address being verified */
	email?: string;
	/** Name of the application sending the email */
	appName?: string;
	/** Number of minutes until the verification link expires */
	expirationMinutes?: number;
	/** Logo URL(s) - a single string or light/dark variants. If omitted, no logo is shown. */
	logoURL?: string | { light: string; dark: string };
	/** Custom CSS class names for styling specific parts of the email */
	classNames?: EmailClassNames;
	/** Custom color scheme for light and dark modes */
	colors?: EmailColors;
	/** Whether to show the "Powered by better-auth" footer */
	poweredBy?: boolean;
	/** Whether to enable dark mode support */
	darkMode?: boolean;
	/** Additional React nodes to inject into the email head */
	head?: ReactNode;
	/**
	 * Localization overrides for customizing email text
	 * @remarks `EmailVerificationEmailLocalization`
	 */
	localization?: Partial<EmailVerificationEmailLocalization>;
}

/**
 * Email template component that sends email verification links to users.
 *
 * This email includes:
 * - Verification button and fallback URL
 * - Expiration time information
 * - Security notice for unauthorized requests
 * - Customizable branding and styling
 * - Support for light/dark mode themes
 *
 * @example
 * ```tsx
 * <EmailVerificationEmail
 *   url="https://example.com/verify?token=abc123"
 *   email="user@example.com"
 *   appName="My App"
 *   expirationMinutes={60}
 *   logoURL="https://example.com/logo.png"
 *   darkMode={true}
 * />
 * ```
 */
export const EmailVerificationEmail = ({
	url,
	email,
	appName,
	expirationMinutes = 60,
	logoURL,
	colors,
	classNames,
	darkMode = true,
	poweredBy,
	head,
	...props
}: EmailVerificationEmailProps) => {
	const localization = {
		...EmailVerificationEmail.localization,
		...props.localization,
	};

	const content = (
		<Text className={cn('text-sm font-normal', classNames?.content)}>
			{(() => {
				const textWithAppName =
					localization.CLICK_BUTTON_TO_VERIFY_EMAIL.replace(
						'{appName}',
						appName || ''
					)
						.replace(/\s{2,}/g, ' ')
						.replace(' .', '.');

				const [beforeEmailAddress, afterEmailAddress] =
					textWithAppName.split('{emailAddress}');

				return email ? (
					<>
						{beforeEmailAddress}

						<Link href={`mailto:${email}`} className="text-primary font-medium">
							{email}
						</Link>

						{afterEmailAddress}
					</>
				) : (
					textWithAppName
						.replace('{emailAddress}', '')
						.replace(/\s{2,}/g, ' ')
						.replace(' .', '.')
				);
			})()}
		</Text>
	);

	const afterSeparator =
		expirationMinutes || appName ? (
			<Text
				className={cn(
					'mb-3 text-xs text-muted-foreground',
					classNames?.description
				)}
			>
				{expirationMinutes
					? localization.THIS_LINK_EXPIRES_IN_MINUTES.replace(
							'{expirationMinutes}',
							expirationMinutes.toString()
						)
					: null}

				{appName && (
					<>
						{expirationMinutes ? ' ' : ''}
						{localization.EMAIL_SENT_BY.replace('{appName}', appName)}
					</>
				)}
			</Text>
		) : null;

	const securityNotice = (
		<Text
			className={cn(
				'mt-3 text-xs text-muted-foreground',
				classNames?.description
			)}
		>
			{localization.IF_YOU_DIDNT_REQUEST_THIS_EMAIL}
		</Text>
	);

	const poweredByNode = poweredBy ? (
		<Text
			className={cn(
				'mt-4 mb-0 text-center text-[11px] text-muted-foreground',
				classNames?.poweredBy
			)}
		>
			{(() => {
				const [beforeBetterAuth, afterBetterAuth] =
					localization.POWERED_BY_BETTER_AUTH.split('{betterAuth}');

				return (
					<>
						{beforeBetterAuth}
						<Link
							href="https://better-auth.com"
							className={cn('text-primary underline', classNames?.link)}
						>
							better-auth
						</Link>
						{afterBetterAuth}
					</>
				);
			})()}
		</Text>
	) : null;

	return (
		<VerificationEmail
			previewText={localization.VERIFY_YOUR_EMAIL_ADDRESS}
			title={localization.VERIFY_EMAIL_ADDRESS}
			content={content}
			url={url}
			buttonText={localization.VERIFY_EMAIL_ADDRESS}
			urlSectionLabel={localization.OR_COPY_AND_PASTE_URL}
			afterSeparator={afterSeparator}
			securityNotice={securityNotice}
			poweredByNode={poweredByNode}
			appName={appName}
			logoURL={logoURL}
			classNames={classNames}
			colors={colors}
			darkMode={darkMode}
			head={head}
		/>
	);
};

/**
 * Default localization strings for the email verification template.
 * Can be overridden via the `localization` prop.
 */
EmailVerificationEmail.localization = emailVerificationEmailLocalization;

/**
 * Example props for previewing the email template in development.
 */
EmailVerificationEmail.PreviewProps = {
	url: 'https://better-auth-ui.com/auth/verify-email?token=example-token',
	appName: 'Better Auth',
	email: 'm@example.com',
	darkMode: true,
} as EmailVerificationEmailProps;
