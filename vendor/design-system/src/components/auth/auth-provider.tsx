import {
	AuthProvider as AuthProviderPrimitive,
	type AuthProviderProps as AuthProviderPropsPrimitive,
} from '@better-auth-ui/react';
import type { ComponentType, PropsWithChildren, ReactNode } from 'react';
import { ErrorToaster } from './error-toaster';
import type { PartialExtendedViewPaths } from './pages/view-paths';
import '../../lib/auth/auth-plugin';

export * from '@better-auth-ui/react';
export * from '@better-auth-ui/react/email';
export * from '@better-auth-ui/react/plugins/api-key';
export * from '@better-auth-ui/react/plugins/captcha';
export * from '@better-auth-ui/react/plugins/magic-link';
export * from '@better-auth-ui/react/plugins/multi-session';
export * from '@better-auth-ui/react/plugins/passkey';
export * from '@better-auth-ui/react/plugins/username';

declare module '@better-auth-ui/core' {
	interface AuthConfig {
		/**
		 * React component used to render internal navigation links.
		 * Typically TanStack Router's `Link` or Next.js's `Link`.
		 */
		Link: ComponentType<
			PropsWithChildren<{ className?: string; href: string; to?: string }>
		>;
	}

	/** Widen `AdditionalField.label` to `ReactNode` in the shadcn package. */
	interface AdditionalFieldRegister {
		label: ReactNode;
	}
}

export type AuthProviderProps = Omit<
	AuthProviderPropsPrimitive,
	'viewPaths'
> & {
	viewPaths?: PartialExtendedViewPaths;
};

/**
 * Provides an authentication context by rendering an auth provider with the sonner toast handler injected, forwarding remaining configuration and rendering `children` inside it.
 *
 * @param children - React nodes to render inside the authentication provider
 * @returns A React element that renders an authentication provider configured with the provided props and toast handler
 */
export function AuthProvider({ children, ...config }: AuthProviderProps) {
	const resolvedViewPaths: PartialExtendedViewPaths = {
		auth: {
			...config.viewPaths?.auth,
			...(config.plugins?.find((p) => p.id === 'magicLink')?.viewPaths?.auth ||
				{}),
		},
		settings: {
			...config.viewPaths?.settings,
		},
	};

	return (
		<AuthProviderPrimitive {...config} viewPaths={resolvedViewPaths}>
			{children}

			<ErrorToaster />
		</AuthProviderPrimitive>
	);
}
