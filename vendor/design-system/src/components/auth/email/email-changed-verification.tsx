import { cn } from '@md-oss/design-system/lib/utils';
import { Link, Text } from '@react-email/components';
import type { EmailClassNames, EmailColors } from './email-styles';
import { VerificationEmail } from './verification-email-base';

const emailChangedVerificationLocalization = {
	VERIFY_YOUR_NEW_EMAIL_ADDRESS: 'Verify your new email address',
	LOGO: 'Logo',
	YOUR_EMAIL_ADDRESS_IS_BEING_CHANGED:
		'Your {appName} account email address is being changed to {newEmail}. Click the button below to verify your new email address.',
	VERIFY_NEW_EMAIL_ADDRESS: 'Verify new email address',
	OR_COPY_AND_PASTE_URL: 'Or copy and paste this URL into your browser:',
	THIS_LINK_EXPIRES_IN_MINUTES:
		'This link expires in {expirationMinutes} minutes.',
	EMAIL_SENT_BY: 'Email sent by {appName}.',
	IF_YOU_DIDNT_REQUEST_THIS_CHANGE:
		"If you didn't request this change, you can safely ignore this email. Your existing email address will remain unchanged.",
	POWERED_BY_BETTER_AUTH: 'Powered by {betterAuth}',
};

/**
 * Localization strings for the EmailChangedVerificationEmail component.
 *
 * Contains all text content used in the email-changed verification email template.
 */
export type EmailChangedVerificationEmailLocalization =
	typeof emailChangedVerificationLocalization;

/**
 * Props for the EmailChangedVerificationEmail component.
 */
export interface EmailChangedVerificationEmailProps {
	/** Verification URL that users must click to confirm their new email address */
	url: string;
	/** The new email address being verified */
	newEmail?: string;
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
	/**
	 * Localization overrides for customizing email text
	 * @remarks `EmailChangedVerificationEmailLocalization`
	 */
	localization?: Partial<EmailChangedVerificationEmailLocalization>;
}

/**
 * Email template component sent when a user initiates an email address change.
 *
 * The user must click the verification link to confirm the new address before the
 * change takes effect. This email includes:
 * - Verification button and fallback URL
 * - Expiration time information
 * - Notice that the existing email remains active if the link is ignored
 * - Customizable branding and styling
 * - Support for light/dark mode themes
 *
 * @example
 * ```tsx
 * <EmailChangedVerificationEmail
 *   url="https://example.com/verify-email-change?token=abc123"
 *   newEmail="new@example.com"
 *   appName="My App"
 *   expirationMinutes={60}
 *   logoURL="https://example.com/logo.png"
 *   darkMode={true}
 * />
 * ```
 */
export const EmailChangedVerificationEmail = ({
	url,
	newEmail,
	appName,
	expirationMinutes = 60,
	logoURL,
	colors,
	classNames,
	darkMode = true,
	poweredBy,
	...props
}: EmailChangedVerificationEmailProps) => {
	const localization = {
		...EmailChangedVerificationEmail.localization,
		...props.localization,
	};

	const content = (
		<Text className={cn('text-sm font-normal', classNames?.content)}>
			{(() => {
				const textWithAppName =
					localization.YOUR_EMAIL_ADDRESS_IS_BEING_CHANGED.replace(
						'{appName}',
						appName || ''
					)
						.replace(/\s{2,}/g, ' ')
						.replace(' .', '.');

				const [beforeNewEmail, afterNewEmail] =
					textWithAppName.split('{newEmail}');

				return newEmail ? (
					<>
						{beforeNewEmail}
						<Link
							href={`mailto:${newEmail}`}
							className="text-primary font-medium"
						>
							{newEmail}
						</Link>
						{afterNewEmail}
					</>
				) : (
					textWithAppName
						.replace('{newEmail}', '')
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
			{localization.IF_YOU_DIDNT_REQUEST_THIS_CHANGE}
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
			previewText={localization.VERIFY_YOUR_NEW_EMAIL_ADDRESS}
			title={localization.VERIFY_NEW_EMAIL_ADDRESS}
			content={content}
			url={url}
			buttonText={localization.VERIFY_NEW_EMAIL_ADDRESS}
			urlSectionLabel={localization.OR_COPY_AND_PASTE_URL}
			afterSeparator={afterSeparator}
			securityNotice={securityNotice}
			poweredByNode={poweredByNode}
			appName={appName}
			logoURL={logoURL}
			classNames={classNames}
			colors={colors}
			darkMode={darkMode}
		/>
	);
};

/**
 * Default localization strings for the email-changed verification template.
 * Can be overridden via the `localization` prop.
 */
EmailChangedVerificationEmail.localization =
	emailChangedVerificationLocalization;

/**
 * Example props for previewing the email template in development.
 */
EmailChangedVerificationEmail.PreviewProps = {
	url: 'https://better-auth-ui.com/auth/verify-email-change?token=example-token',
	appName: 'Better Auth',
	newEmail: 'new@example.com',
	darkMode: true,
} as EmailChangedVerificationEmailProps;
