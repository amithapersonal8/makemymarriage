"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useWeddingDrafts } from "@/components/weddings/wedding-draft-provider";
import {
  watchSession,
  type SessionStatus,
} from "@/components/auth/session-sync";

const SessionContext = createContext<{
  status: SessionStatus;
  validate: () => Promise<boolean>;
} | null>(null);
export function useProtectedSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("A protected session is required.");
  return session;
}

export function SessionGuard({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { resume } = useWeddingDrafts();
  const [status, setStatus] = useState<SessionStatus>("checking");
  const currentStatus = useRef<SessionStatus>("checking");
  const watcher = useRef<ReturnType<typeof watchSession> | null>(null);

  useEffect(() => {
    // Clears drafts from another identity before any continuation is offered.
    resume(userId);
    const subscription = watchSession(userId, (next) => {
      currentStatus.current = next;
      setStatus(next);
      if (next === "invalid" && !resume(userId)) {
        router.replace("/login");
        router.refresh();
      }
    });
    watcher.current = subscription;
    return () => {
      subscription.stop();
      watcher.current = null;
    };
  }, [router, userId, resume]);

  return (
    <SessionContext.Provider
      value={{
        status,
        async validate() {
          await watcher.current?.check();
          return currentStatus.current === "valid";
        },
      }}
    >
      {/* Keep form state mounted across checks, outages, and expired sessions. */}
      <div hidden={status !== "valid"} inert={status !== "valid"}>
        {children}
      </div>
      {status !== "valid" && (
        <section className="account-section">
          <div className="account-card" role="status" aria-live="polite">
            <p className="eyebrow">Your account</p>
            {status === "invalid" ? (
              <>
                <h1>Your session has ended.</h1>
                <p>
                  Your draft is kept in this tab. Log in with the same account
                  to continue. Refreshing or closing this tab discards it.
                </p>
                <Link className="button" href="/login">
                  Log in to continue
                </Link>
              </>
            ) : status === "unavailable" ? (
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
              <p>Checking your session…</p>
            )}
          </div>
        </section>
      )}
    </SessionContext.Provider>
  );
}
