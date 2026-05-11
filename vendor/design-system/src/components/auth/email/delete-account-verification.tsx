import { cn } from '@md-oss/design-system/lib/utils';
import { Link, Text } from '@react-email/components';
import type { EmailClassNames, EmailColors } from './email-styles';
import { VerificationEmail } from './verification-email-base';

const deleteAccountVerificationLocalization = {
	CONFIRM_YOUR_ACCOUNT_DELETION: 'Confirm your account deletion',
	LOGO: 'Logo',
	YOU_REQUESTED_TO_DELETE_YOUR_ACCOUNT:
		'You requested to permanently delete your {appName} account. Click the button below to confirm. This action cannot be undone.',
	CONFIRM_ACCOUNT_DELETION: 'Confirm account deletion',
	OR_COPY_AND_PASTE_URL: 'Or copy and paste this URL into your browser:',
	THIS_LINK_EXPIRES_IN_MINUTES:
		'This link expires in {expirationMinutes} minutes.',
	EMAIL_SENT_BY: 'Email sent by {appName}.',
	IF_YOU_DIDNT_REQUEST_THIS:
		"If you didn't request this, you can safely ignore this email. Your account will not be deleted.",
	POWERED_BY_BETTER_AUTH: 'Powered by {betterAuth}',
};

/**
 * Localization strings for the DeleteAccountVerificationEmail component.
 *
 * Contains all text content used in the delete-account verification email template.
 */
export type DeleteAccountVerificationEmailLocalization =
	typeof deleteAccountVerificationLocalization;

/**
 * Props for the DeleteAccountVerificationEmail component.
 */
export interface DeleteAccountVerificationEmailProps {
	/** Verification URL the user must click to confirm account deletion */
	url: string;
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
	 * @remarks `DeleteAccountVerificationEmailLocalization`
	 */
	localization?: Partial<DeleteAccountVerificationEmailLocalization>;
}

/**
 * Email template component sent when a user requests to delete their account.
 *
 * The user must click the verification link to confirm the deletion. This email includes:
 * - Confirmation button and fallback URL
 * - Expiration time information
 * - Notice that the account will not be deleted if the link is ignored
 * - Customizable branding and styling
 * - Support for light/dark mode themes
 *
 * @example
 * ```tsx
 * <DeleteAccountVerificationEmail
 *   url="https://example.com/confirm-delete?token=abc123"
 *   appName="My App"
 *   expirationMinutes={60}
 *   logoURL="https://example.com/logo.png"
 *   darkMode={true}
 * />
 * ```
 */
export const DeleteAccountVerificationEmail = ({
	url,
	appName,
	expirationMinutes = 60,
	logoURL,
	colors,
	classNames,
	darkMode = true,
	poweredBy,
	...props
}: DeleteAccountVerificationEmailProps) => {
	const localization = {
		...DeleteAccountVerificationEmail.localization,
		...props.localization,
	};

	const content = (
		<Text className={cn('text-sm font-normal', classNames?.content)}>
			{localization.YOU_REQUESTED_TO_DELETE_YOUR_ACCOUNT.replace(
				'{appName}',
				appName || ''
			)
				.replace(/\s{2,}/g, ' ')
				.replace(' .', '.')}
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
			{localization.IF_YOU_DIDNT_REQUEST_THIS}
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
			previewText={localization.CONFIRM_YOUR_ACCOUNT_DELETION}
			title={localization.CONFIRM_ACCOUNT_DELETION}
			content={content}
			url={url}
			buttonText={localization.CONFIRM_ACCOUNT_DELETION}
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
 * Default localization strings for the delete-account verification template.
 * Can be overridden via the `localization` prop.
 */
DeleteAccountVerificationEmail.localization =
	deleteAccountVerificationLocalization;

/**
 * Example props for previewing the email template in development.
 */
DeleteAccountVerificationEmail.PreviewProps = {
	url: 'https://better-auth-ui.com/auth/confirm-delete?token=example-token',
	appName: 'Better Auth',
	darkMode: true,
} as DeleteAccountVerificationEmailProps;
