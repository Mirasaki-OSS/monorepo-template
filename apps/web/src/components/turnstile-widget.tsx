import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import type { CaptchaRenderProps } from '@md-oss/design-system/components/auth/auth-provider';
import { useEffect, useRef } from 'react';
import { clientEnv } from '@/lib/client/env';

export function TurnstileWidget({
  setToken,
  clearToken,
  setReset,
}: CaptchaRenderProps) {
  const ref = useRef<TurnstileInstance>(null);

  useEffect(() => {
    setReset(() => ref.current?.reset());
    return () => setReset(null);
  }, [setReset]);

  if (!clientEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    console.warn(
      'Turnstile site key is not set. Please set NEXT_PUBLIC_TURNSTILE_SITE_KEY in your environment variables to enable bot protection on auth forms.'
    );
    return null;
  }

  return (
    <Turnstile
      ref={ref}
      siteKey={clientEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      onSuccess={setToken}
      onError={clearToken}
      onExpire={clearToken}
      options={{ size: 'flexible' }}
    />
  );
}
