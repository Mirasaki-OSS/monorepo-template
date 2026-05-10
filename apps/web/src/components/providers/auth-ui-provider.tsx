import { activeSocialProviders } from '@md-oss/api/auth/providers';
import {
  AuthProvider,
  captchaPlugin,
  // deleteUserPlugin,
} from '@md-oss/design-system/components/auth/auth-provider';
import { clearUserSessionsPlugin } from '@md-oss/design-system/lib/auth/clear-user-sessions-plugin';
import { deleteUserPlugin } from '@md-oss/design-system/lib/auth/delete-user-plugin';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/client/auth';
import { clientEnv } from '@/lib/client/env';
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
      viewPaths={{
        auth: {},
        settings: {},
      }}
      queryClient={queryClient}
      redirectTo="/" // Default redirect to
      socialProviders={activeSocialProviders}
      navigate={({ to, replace }) =>
        replace ? router.replace(to) : router.push(to)
      }
      Link={Link}
      // Start opt-in functionality/components
      plugins={[
        captchaPlugin({ render: TurnstileWidget }),
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
        forgotPassword: false,
        name: true,
        rememberMe: true,
        requireEmailVerification: false,
      }}
    >
      {children}
    </AuthProvider>
  );
}
