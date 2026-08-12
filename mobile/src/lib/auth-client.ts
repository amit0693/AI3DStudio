import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins';

const AUTH_BASE_URL = 'https://baylayer-labs.amitcodecraft.chatgpt.site';

type ClientResult<T> = Promise<{
  data: T | null;
  error: { message?: string; code?: string } | null;
}>;

const baseClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  plugins: [
    // Better Auth 1.6's runtime plugins are compatible here. TypeScript 6
    // currently compares two over-specific fetch generics, so actions are
    // described explicitly below while preserving the official runtime plugin.
    expoClient({
      scheme: 'baylayer',
      storagePrefix: 'baylayer-auth',
      cookiePrefix: 'baylayer',
      storage: {
        getItem: SecureStore.getItem,
        setItem: SecureStore.setItem,
      },
    }) as never,
    emailOTPClient() as never,
  ],
});

export const authClient = baseClient as typeof baseClient & {
  getCookie: () => string;
  emailOtp: {
    sendVerificationOtp: (input: { email: string; type: 'sign-in' }) => ClientResult<{ success: boolean }>;
  };
  signIn: typeof baseClient.signIn & {
    emailOtp: (input: { email: string; otp: string; name?: string }) => ClientResult<{ token: string }>;
  };
};

export async function fetchAuthConfig() {
  const response = await fetch(`${AUTH_BASE_URL}/api/auth/config`);
  if (!response.ok) throw new Error('Sign-in configuration is unavailable.');
  return response.json() as Promise<{ enabled: boolean; google: boolean; emailOtp: boolean }>;
}
