import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

import { getAuthConfig, getDb } from "@/db";
import * as schema from "@/db/schema";
import { sendAuthOtp } from "@/lib/auth-email";

const config = getAuthConfig();

export const authAvailability = {
  core: Boolean(config.secret),
  google: Boolean(config.googleClientId && config.googleClientSecret),
  emailOtp: Boolean(config.resendApiKey),
};

export const auth = betterAuth({
  appName: "BayLayer Labs",
  baseURL: config.baseUrl,
  // Requests are rejected by the route handler when the real secret is absent.
  secret:
    config.secret ||
    "baylayer-auth-disabled-until-a-production-secret-is-configured-2026",
  database: drizzleAdapter(getDb(), {
    provider: "sqlite",
    schema: {
      ...schema,
      user: schema.authUsers,
      session: schema.authSessions,
      account: schema.authAccounts,
      verification: schema.authVerifications,
    },
  }),
  socialProviders:
    config.googleClientId && config.googleClientSecret
      ? {
          google: {
            clientId: config.googleClientId,
            clientSecret: config.googleClientSecret,
          },
        }
      : {},
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  trustedOrigins: [
    config.baseUrl,
    "baylayer://",
    "baylayer://*",
    ...(process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:*", "exp://*", "exps://*"]),
  ],
  advanced: {
    cookiePrefix: "baylayer",
  },
  plugins: [
    expo(),
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await sendAuthOtp(email, otp);
      },
      expiresIn: 600,
      otpLength: 6,
      allowedAttempts: 5,
      storeOTP: "hashed",
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
    }),
    nextCookies(),
  ],
});
