"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  watchSession,
  type SessionStatus,
} from "@/components/auth/session-sync";

export function SessionGuard({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<SessionStatus>("checking");
  const watcher = useRef<ReturnType<typeof watchSession> | null>(null);

  useEffect(() => {
    const subscription = watchSession(userId, (next) => {
      setStatus(next);
      if (next === "invalid") {
        router.replace("/login");
        router.refresh();
      }
    });
    watcher.current = subscription;
    return () => {
      subscription.stop();
      watcher.current = null;
    };
  }, [router, userId]);

  if (status === "valid") return children;
  return (
    <section className="account-section">
      <div className="account-card" role="status" aria-live="polite">
        <p className="eyebrow">Your account</p>
        {status === "unavailable" ? (
          <>
            <h1>We can’t verify your session.</h1>
            <p>Please check your connection and try again.</p>
            <button
              className="button"
              type="button"
              onClick={() => void watcher.current?.check()}
            >
              Try again
            </button>
          </>
        ) : (
          <p>
            {status === "invalid"
              ? "You’ve been signed out. Taking you to log in…"
              : "Checking your session…"}
          </p>
        )}
      </div>
    </section>
  );
}
