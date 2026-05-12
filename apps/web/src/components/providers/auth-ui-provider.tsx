import { activeSocialProviders } from '@md-oss/api/auth/providers';
import {
  AuthProvider,
  captchaPlugin,
} from '@md-oss/design-system/components/auth/auth-provider';
import type { SettingsLocalization } from '@md-oss/design-system/components/auth/localization';
import { apiKeyPlugin } from '@md-oss/design-system/lib/auth/api-key-plugin';
import { clearUserSessionsPlugin } from '@md-oss/design-system/lib/auth/clear-user-sessions-plugin';
import { deleteUserPlugin } from '@md-oss/design-system/lib/auth/delete-user-plugin';
import { magicLinkPlugin } from '@md-oss/design-system/lib/auth/magic-link-plugin';
import { passkeyPlugin } from '@md-oss/design-system/lib/auth/passkey-plugin';
import { themePlugin } from '@md-oss/design-system/lib/auth/theme-plugin';
import { usernamePlugin } from '@md-oss/design-system/lib/auth/username-plugin';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { authClient } from '@/lib/client/auth';
import { clientEnv } from '@/lib/client/env';
import { customExtendedViewPaths } from '@/lib/view-paths';
import { TurnstileWidget } from '../turnstile-widget';

export type AuthProviderProps = React.ComponentProps<typeof AuthProvider>;

export type AuthUIProviderProps = Pick<
  AuthProviderProps,
  'queryClient' | 'children'
>;

export function AuthUIProvider({ children, queryClient }: AuthUIProviderProps) {
  const router = useRouter();

  return (
    <AuthProvider
      baseURL={clientEnv.NEXT_PUBLIC_APP_URL}
      authClient={authClient}
      basePaths={{
        auth: '/auth',
        settings: '/settings',
        organization: '/organization',
      }}
      localization={{
        settings: {
          sessions: 'Sessions',
          linkedAccounts: 'Connections',
        } as Partial<SettingsLocalization>,
      }}
      viewPaths={customExtendedViewPaths}
      queryClient={queryClient}
      redirectTo="/" // Default redirect to
      socialProviders={activeSocialProviders}
      navigate={({ to, replace }) =>
        replace ? router.replace(to) : router.push(to)
      }
      Link={Link}
      // Start opt-in functionality/components
      plugins={[
        usernamePlugin({
          displayUsername: true,
          isUsernameAvailable: true,
          minUsernameLength: 3,
          maxUsernameLength: 32,
        }),
        passkeyPlugin(),
        themePlugin({ useTheme }),
        captchaPlugin({ render: TurnstileWidget }),
        apiKeyPlugin(),
        magicLinkPlugin(),
        // Note: The order matters for the DangerZone component:
        clearUserSessionsPlugin({ clearCurrentSession: false }),
        deleteUserPlugin({
          sendDeleteAccountVerification: true,
        }),
      ]}
      avatar={{
        enabled: true,
        extension: 'webp',
        size: 256,
        // [DEV] Internal Avatar Endpoints
        // upload(file) {},
        // delete(url) {},
        // resize(file, size, extension) {},
      }}
      additionalFields={[
        {
          name: 'bio',
          type: 'string',
          inputType: 'textarea',
          label: 'Bio',
          copyable: true,
          placeholder: 'Tell us a bit about yourself',
          min: 0,
          max: 160,
          profile: true,
          required: false,
        },
      ]}
      emailAndPassword={{
        enabled: true,
        minPasswordLength: 8,
        confirmPassword: true,
        maxPasswordLength: 128,
        forgotPassword: true,
        name: true,
        rememberMe: false,
        requireEmailVerification: false,
      }}
    >
      {children}
    </AuthProvider>
  );
}
