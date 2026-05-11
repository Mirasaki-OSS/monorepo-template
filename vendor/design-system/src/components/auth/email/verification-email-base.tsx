import { cn } from '@md-oss/design-system/lib/utils';
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	pixelBasedPreset,
	Section,
	Tailwind,
	Text,
} from '@react-email/components';
import type { ReactNode } from 'react';
import {
	type EmailClassNames,
	type EmailColors,
	EmailStyles,
} from './email-styles';

/**
 * Props for the VerificationEmail base layout component.
 *
 * This component provides the structural shell for all verification-style emails.
 * Specific email templates compose on top of this by providing the content slots.
 */
export interface VerificationEmailProps {
	/** Preview text displayed in email clients before the email is opened */
	previewText: string;
	/** The email heading / title */
	title: ReactNode;
	/** Main body content rendered between the heading and the action button */
	content: ReactNode;
	/** The verification / action URL */
	url: string;
	/** Label for the primary CTA button */
	buttonText: string;
	/**
	 * Label for the "copy URL" fallback section.
	 * @default "Or copy and paste this URL into your browser:"
	 */
	urlSectionLabel?: string;
	/** Content rendered after the horizontal separator (e.g. expiration notice, sent-by) */
	afterSeparator?: ReactNode;
	/** Security / disclaimer notice rendered below afterSeparator */
	securityNotice?: ReactNode;
	/** "Powered by" footer node */
	poweredByNode?: ReactNode;
	/** Name of the application sending the email — used for logo alt text */
	appName?: string;
	/** Logo URL(s) – a single string or separate light/dark variants */
	logoURL?: string | { light: string; dark: string };
	/** Custom CSS class names for styling individual slots */
	classNames?: EmailClassNames;
	/** Custom color scheme for light and dark modes */
	colors?: EmailColors;
	/** Whether to enable dark mode support */
	darkMode?: boolean;
	/** Additional React nodes injected into the email <head> */
	head?: ReactNode;
}

const DEFAULT_URL_SECTION_LABEL =
	'Or copy and paste this URL into your browser:';

/**
 * Reusable base layout for verification-style emails.
 *
 * Renders the full email shell (HTML → Body → Card) and the canonical
 * verification flow: logo → heading → content → button → URL fallback →
 * separator → afterSeparator → securityNotice → poweredByNode.
 *
 * Consumers should compose over this component instead of duplicating the
 * email scaffolding in every template. See `EmailVerificationEmail` and
 * `EmailChangedVerificationEmail` for reference implementations.
 *
 * @example
 * ```tsx
 * <VerificationEmail
 *   previewText="Verify your email"
 *   title="Verify your email address"
 *   content={<Text>Click below to verify.</Text>}
 *   url="https://example.com/verify?token=abc"
 *   buttonText="Verify email address"
 *   appName="My App"
 * />
 * ```
 */
export const VerificationEmail = ({
	previewText,
	title,
	content,
	url,
	buttonText,
	urlSectionLabel = DEFAULT_URL_SECTION_LABEL,
	afterSeparator,
	securityNotice,
	poweredByNode,
	appName,
	logoURL,
	classNames,
	colors,
	darkMode = true,
	head,
}: VerificationEmailProps) => {
	return (
		<Html>
			<Head>
				<meta content="light dark" name="color-scheme" />
				<meta content="light dark" name="supported-color-schemes" />

				<EmailStyles colors={colors} darkMode={darkMode} />

				{head}
			</Head>

			<Preview>{previewText}</Preview>

			<Tailwind config={{ presets: [pixelBasedPreset] }}>
				<Body className={cn('bg-background font-sans', classNames?.body)}>
					<Container
						className={cn(
							'mx-auto my-auto max-w-xl px-2 py-10',
							classNames?.container
						)}
					>
						<Section
							className={cn(
								'bg-card text-card-foreground rounded-none border border-border p-8',
								classNames?.card
							)}
						>
							{logoURL &&
								(typeof logoURL === 'string' ? (
									<Img
										src={logoURL}
										width={48}
										height={48}
										alt={appName ?? 'Logo'}
										className={cn('mx-auto mb-8', classNames?.logo)}
									/>
								) : (
									<>
										<Img
											src={logoURL.light}
											width={48}
											height={48}
											alt={appName ?? 'Logo'}
											className={cn(
												'mx-auto mb-8 logo-light',
												classNames?.logo
											)}
										/>
										<Img
											src={logoURL.dark}
											width={48}
											height={48}
											alt={appName ?? 'Logo'}
											className={cn(
												'hidden mx-auto mb-8 logo-dark',
												classNames?.logo
											)}
										/>
									</>
								))}

							<Heading
								className={cn(
									'm-0 mb-5 text-2xl font-semibold',
									classNames?.title
								)}
							>
								{title}
							</Heading>

							{content}

							<Section className="my-6">
								<Button
									href={url}
									className={cn(
										'inline-block whitespace-nowrap rounded-none text-sm font-medium py-2.5 px-6 bg-primary text-primary-foreground no-underline',
										classNames?.button
									)}
								>
									{buttonText}
								</Button>
							</Section>

							<Text
								className={cn(
									'mb-3 text-xs text-muted-foreground',
									classNames?.description
								)}
							>
								{urlSectionLabel}
							</Text>

							<Link
								className={cn(
									'break-all text-xs text-primary',
									classNames?.link
								)}
								href={url}
							>
								{url}
							</Link>

							<Hr
								className={cn(
									'my-6 w-full border border-solid border-border',
									classNames?.separator
								)}
							/>

							{afterSeparator}

							{securityNotice}

							{poweredByNode}
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};
