"use client";

import { FormEvent, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

type AuthConfig = {
  enabled: boolean;
  google: boolean;
  emailOtp: boolean;
};

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "We could not complete sign-in. Please try again.";
}

export function SignInCard({ returnTo }: { returnTo: string }) {
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [step, setStep] = useState<"email" | "code">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/config", { cache: "no-store" })
      .then((response) => response.json())
      .then((value: AuthConfig) => setConfig(value))
      .catch((error: unknown) => {
        // Sign-in degrades to unavailable when the config cannot be read.
        console.error("Auth configuration could not be loaded", error);
        setConfig({ enabled: false, google: false, emailOtp: false });
      });
  }, []);

  async function signInWithGoogle() {
    setPending(true);
    setMessage("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: returnTo,
      });
      if (result.error) throw result.error;
    } catch (error) {
      setMessage(errorMessage(error));
      setPending(false);
    }
  }

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "sign-in",
      });
      if (result.error) throw result.error;
      setStep("code");
      setMessage("A 6-digit code was sent to your email.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const result = await authClient.signIn.emailOtp({
        email: email.trim().toLowerCase(),
        otp: otp.replace(/\D/g, ""),
        name: name.trim() || undefined,
      });
      if (result.error) throw result.error;
      window.location.assign(returnTo);
    } catch (error) {
      setMessage(errorMessage(error));
      setPending(false);
    }
  }

  const unavailable = config && !config.google && !config.emailOtp;

  return (
    <section className="auth-card" aria-labelledby="sign-in-title">
      <p className="eyebrow"><span /> Secure customer account</p>
      <h1 id="sign-in-title">Sign in to<br /><em>BayLayer Labs.</em></h1>
      <p className="auth-intro">See your orders on any device and check out faster. No password to remember.</p>

      {config?.google && (
        <button className="auth-google" type="button" onClick={signInWithGoogle} disabled={pending}>
          <span aria-hidden="true">G</span> Continue with Google
        </button>
      )}

      {config?.google && config.emailOtp && <div className="auth-divider"><span>or</span></div>}

      {config?.emailOtp && step === "email" && (
        <form className="auth-form" onSubmit={requestCode}>
          <label>
            <span>Name <small>for new accounts</small></span>
            <input autoComplete="name" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
          </label>
          <label>
            <span>Email address</span>
            <input autoComplete="email" inputMode="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </label>
          <button className="button button-dark" disabled={pending} type="submit">{pending ? "Sending code…" : "Email me a code"}</button>
        </form>
      )}

      {config?.emailOtp && step === "code" && (
        <form className="auth-form" onSubmit={verifyCode}>
          <p className="auth-destination">Code sent to <strong>{email}</strong></p>
          <label>
            <span>6-digit verification code</span>
            <input className="otp-input" autoComplete="one-time-code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" />
          </label>
          <button className="button button-dark" disabled={pending || otp.length !== 6} type="submit">{pending ? "Verifying…" : "Verify and sign in"}</button>
          <button className="auth-text-button" type="button" onClick={() => { setStep("email"); setOtp(""); setMessage(""); }}>Use a different email</button>
        </form>
      )}

      {!config && <p className="auth-status">Checking available sign-in methods…</p>}
      {unavailable && <p className="auth-warning" role="status">Sign-in is ready in the app, but the Google and email provider credentials still need to be connected by the site owner.</p>}
      {message && <p className="auth-status" role="status">{message}</p>}
      <p className="auth-legal">By continuing, you agree to our <a href="/terms">Terms</a> and acknowledge our <a href="/privacy">Privacy Notice</a>.</p>
    </section>
  );
}
