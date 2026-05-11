import {
	DeleteAccountVerificationEmail,
	type DeleteAccountVerificationEmailProps,
} from '@md-oss/design-system/components/auth/email/delete-account-verification';
import {
	EmailChangedEmail,
	type EmailChangedEmailProps,
} from '@md-oss/design-system/components/auth/email/email-changed';
import {
	EmailChangedVerificationEmail,
	type EmailChangedVerificationEmailProps,
} from '@md-oss/design-system/components/auth/email/email-changed-verification';
import {
	EmailVerificationEmail,
	type EmailVerificationEmailProps,
} from '@md-oss/design-system/components/auth/email/email-verification';
import {
	MagicLinkEmail,
	type MagicLinkEmailProps,
} from '@md-oss/design-system/components/auth/email/magic-link';
import {
	NewDeviceEmail,
	type NewDeviceEmailProps,
} from '@md-oss/design-system/components/auth/email/new-device';
import {
	OtpEmail,
	type OtpEmailProps,
} from '@md-oss/design-system/components/auth/email/otp-email';
import {
	PasswordChangedEmail,
	type PasswordChangedEmailProps,
} from '@md-oss/design-system/components/auth/email/password-changed';
import {
	ResetPasswordEmail,
	type ResetPasswordEmailProps,
} from '@md-oss/design-system/components/auth/email/reset-password';

export {
	VerificationEmail,
	type VerificationEmailProps,
} from '@md-oss/design-system/components/auth/email/verification-email-base';

import { render } from '@react-email/components';
import { Resend } from 'resend';
import { serverEnv } from './env';

const { RESEND_API_KEY, RESEND_FROM_EMAIL: _RESEND_FROM_EMAIL } = serverEnv();

const RESEND_FROM_EMAIL = _RESEND_FROM_EMAIL || '';

export const resend = new Resend(RESEND_API_KEY);

export type EmailPropsTo<NameIsOptional extends boolean = false> = {
	email: string;
	name: NameIsOptional extends true ? string | null : string;
};

export type EmailProps<ToNameIsOptional extends boolean = false> = {
	to: EmailPropsTo<ToNameIsOptional>;
};

export const emailService = {
	async sendDeleteAccountVerificationEmail(
		emailProps: EmailProps,
		templateProps: DeleteAccountVerificationEmailProps
	) {
		const {
			to: { email, name },
		} = emailProps;
		const html = await render(DeleteAccountVerificationEmail(templateProps));

		return resend.emails.send({
			from: RESEND_FROM_EMAIL,
			to: email,
			subject: `${name}, confirm your account deletion`,
			html,
		});
	},

	async sendEmailChangedEmail(
		emailProps: EmailProps,
		templateProps: EmailChangedEmailProps
	) {
		const {
			to: { email, name },
		} = emailProps;
		const html = await render(EmailChangedEmail(templateProps));

		return resend.emails.send({
			from: RESEND_FROM_EMAIL,
			to: email,
			subject: `${name}, your email has been changed`,
			html,
		});
	},

	async sendEmailChangeVerificationEmail(
		emailProps: EmailProps,
		templateProps: EmailChangedVerificationEmailProps
	) {
		const {
			to: { email, name },
		} = emailProps;
		const html = await render(EmailChangedVerificationEmail(templateProps));

		return resend.emails.send({
			from: RESEND_FROM_EMAIL,
			to: email,
			subject: `${name}, please verify your new email`,
			html,
		});
	},

	async sendEmailVerificationEmail(
		emailProps: EmailProps,
		templateProps: EmailVerificationEmailProps
	) {
		const {
			to: { email, name },
		} = emailProps;
		const html = await render(EmailVerificationEmail(templateProps));

		return resend.emails.send({
			from: RESEND_FROM_EMAIL,
			to: email,
			subject: `${name}, please verify your email`,
			html,
		});
	},

	async sendMagicLinkEmail(
		emailProps: EmailProps<true>,
		templateProps: MagicLinkEmailProps
	) {
		const {
			to: { email },
		} = emailProps;
		const html = await render(MagicLinkEmail(templateProps));

		return resend.emails.send({
			from: RESEND_FROM_EMAIL,
			to: email,
			subject: templateProps.appName
				? `Sign in to your account on ${templateProps.appName}`
				: `Sign in to your account`,
			html,
		});
	},

	async sendNewDeviceEmail(
		emailProps: EmailProps,
		templateProps: NewDeviceEmailProps
	) {
		const {
			to: { email, name },
		} = emailProps;
		const html = await render(NewDeviceEmail(templateProps));

		return resend.emails.send({
			from: RESEND_FROM_EMAIL,
			to: email,
			subject: `${name}, new device sign-in detected`,
			html,
		});
	},

	async sendOtpEmail(emailProps: EmailProps, templateProps: OtpEmailProps) {
		const {
			to: { email, name },
		} = emailProps;
		const html = await render(OtpEmail(templateProps));

		return resend.emails.send({
			from: RESEND_FROM_EMAIL,
			to: email,
			subject: `${name}, verify your email using this code`,
			html,
		});
	},

	async sendPasswordChangedEmail(
		emailProps: EmailProps,
		templateProps: PasswordChangedEmailProps
	) {
		const {
			to: { email, name },
		} = emailProps;
		const html = await render(PasswordChangedEmail(templateProps));

		return resend.emails.send({
			from: RESEND_FROM_EMAIL,
			to: email,
			subject: `${name}, your password has been changed`,
			html,
		});
	},

	async sendResetPasswordEmail(
		emailProps: EmailProps,
		templateProps: ResetPasswordEmailProps
	) {
		const {
			to: { email, name },
		} = emailProps;
		const html = await render(ResetPasswordEmail(templateProps));

		return resend.emails.send({
			from: RESEND_FROM_EMAIL,
			to: email,
			subject: `${name}, reset your password`,
			html,
		});
	},
};

export type EmailResult = Awaited<ReturnType<typeof resend.emails.send>>;
