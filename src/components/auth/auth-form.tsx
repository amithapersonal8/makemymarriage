"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

export function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const errorRef = useRef<HTMLDivElement>(null);

  function showError(message: string) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const password = form.get("password");
    setError("");
    setFieldErrors({});
    if (isSignup && password !== form.get("confirmPassword")) {
      setFieldErrors({ confirmPassword: "The passwords do not match." });
      showError("Check that both passwords match.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`/api/v1/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...(isSignup ? { name: form.get("name") } : {}),
          email: form.get("email"),
          password,
        }),
      });
      if (response.ok) {
        router.replace("/account");
        router.refresh();
        return;
      }
      const result: unknown = await response.json();
      if (typeof result === "object" && result !== null) {
        if ("details" in result && Array.isArray(result.details)) {
          const errors: Record<string, string> = {};
          for (const detail of result.details) {
            if (
              typeof detail === "object" &&
              detail !== null &&
              "field" in detail &&
              typeof detail.field === "string" &&
              "message" in detail &&
              typeof detail.message === "string"
            )
              errors[detail.field] = detail.message;
          }
          setFieldErrors(errors);
        }
        if ("message" in result && typeof result.message === "string") {
          showError(result.message);
          return;
        }
      }
      showError("We couldn’t complete that request. Please try again.");
    } catch {
      showError(
        "We couldn’t reach the server. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form className="auth-form" onSubmit={submit} aria-busy={pending}>
        <div
          className="auth-error"
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          hidden={!error}
        >
          {error}
        </div>
        {isSignup && (
          <div className="form-field">
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              required
              maxLength={100}
              placeholder="How should we call you?"
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
            />
            {fieldErrors.name && (
              <p className="field-error" id="name-error">
                {fieldErrors.name}
              </p>
            )}
          </div>
        )}
        <div className="form-field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@example.com"
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
          />
          {fieldErrors.email && (
            <p className="field-error" id="email-error">
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <div className="password-input">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={isSignup ? 15 : 1}
              maxLength={128}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={
                isSignup ? "password-hint password-error" : "password-error"
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-controls="password"
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {isSignup && (
            <p className="form-hint" id="password-hint">
              Use 15–128 characters. A memorable passphrase works well.
            </p>
          )}
          <p className="field-error" id="password-error">
            {fieldErrors.password}
          </p>
        </div>
        {isSignup && (
          <div className="form-field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              maxLength={128}
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby="confirmPassword-error"
            />
            <p className="field-error" id="confirmPassword-error">
              {fieldErrors.confirmPassword}
            </p>
          </div>
        )}
        <button className="button auth-submit" disabled={pending} type="submit">
          {pending
            ? isSignup
              ? "Creating your account…"
              : "Logging you in…"
            : isSignup
              ? "Create your account"
              : "Log in"}
          <span aria-hidden="true">→</span>
        </button>
      </form>
      <p className="auth-switch">
        {isSignup
          ? "Already part of the celebration?"
          : "New to Make My Marriage?"}{" "}
        <Link href={isSignup ? "/login" : "/signup"}>
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
      <div className="guest-login-note">
        <strong>Attending as an invited guest?</strong>
        <p>
          Use the personal invitation link from your hosts. Guests don’t need an
          account to RSVP.
        </p>
      </div>
      {!isSignup && (
        <p className="form-hint recovery-note">
          Password recovery isn’t available yet. Please keep your password
          somewhere safe.
        </p>
      )}
    </>
  );
}
