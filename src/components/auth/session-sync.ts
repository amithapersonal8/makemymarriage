export const logoutStorageKey = "mmm:logout";
export type SessionStatus = "checking" | "valid" | "invalid" | "unavailable";

export function notifyOtherTabsOfLogout() {
  try {
    // Notification only: never store session tokens, user IDs, or account details.
    window.localStorage.setItem(logoutStorageKey, crypto.randomUUID());
  } catch {
    // Storage can be blocked. Focus/visibility checks still validate the cookie.
  }
}

export function watchSession(
  userId: string,
  onStatus: (status: SessionStatus) => void,
) {
  let stopped = false;
  let invalid = false;
  let revision = 0;
  let pending: AbortController | undefined;
  let poll: number | undefined;

  function invalidate() {
    if (stopped || invalid) return;
    invalid = true;
    revision++;
    pending?.abort();
    window.clearTimeout(poll);
    onStatus("invalid");
  }

  async function check() {
    if (stopped || invalid || document.visibilityState === "hidden") return;
    const current = ++revision;
    pending?.abort();
    const controller = new AbortController();
    pending = controller;
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    onStatus("checking");
    try {
      const response = await fetch("/api/v1/auth/me", {
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      });
      if (stopped || invalid || current !== revision) return;
      if (response.status === 401) {
        invalidate();
        return;
      }
      if (!response.ok) {
        onStatus("unavailable");
        return;
      }
      const result: unknown = await response.json();
      if (stopped || invalid || current !== revision) return;
      if (
        typeof result !== "object" ||
        result === null ||
        !("data" in result) ||
        typeof result.data !== "object" ||
        result.data === null ||
        !("user" in result.data) ||
        typeof result.data.user !== "object" ||
        result.data.user === null ||
        !("id" in result.data.user) ||
        typeof result.data.user.id !== "string"
      ) {
        onStatus("unavailable");
        return;
      }
      if (result.data.user.id !== userId) {
        invalidate();
        return;
      }
      onStatus("valid");
    } catch {
      if (!stopped && !invalid && current === revision) onStatus("unavailable");
    } finally {
      window.clearTimeout(timeout);
      if (!stopped && !invalid && current === revision) {
        window.clearTimeout(poll);
        poll = window.setTimeout(() => void check(), 30000);
      }
    }
  }

  function onStorage(event: StorageEvent) {
    if (event.key === logoutStorageKey && event.newValue) invalidate();
  }
  function onFocus() {
    void check();
  }
  function onVisibility() {
    if (document.visibilityState === "hidden") {
      revision++;
      pending?.abort();
      window.clearTimeout(poll);
      if (!invalid) onStatus("checking");
    } else {
      void check();
    }
  }

  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", onFocus);
  window.addEventListener("pageshow", onFocus);
  document.addEventListener("visibilitychange", onVisibility);
  void check();

  return {
    check,
    stop() {
      stopped = true;
      revision++;
      pending?.abort();
      window.clearTimeout(poll);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
