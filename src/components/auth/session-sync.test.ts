import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  logoutStorageKey,
  notifyOtherTabsOfLogout,
  watchSession,
  type SessionStatus,
} from "@/components/auth/session-sync";

let browser: EventTarget & {
  localStorage: { setItem: ReturnType<typeof vi.fn> };
};
let page: EventTarget & { visibilityState: string };
const fetchMock = vi.fn<typeof fetch>();
const watchers: ReturnType<typeof watchSession>[] = [];
function validResponse(id = "user-a") {
  return new Response(JSON.stringify({ data: { user: { id } } }), {
    status: 200,
  });
}
function start() {
  const status = vi.fn<(value: SessionStatus) => void>();
  const watcher = watchSession("user-a", status);
  watchers.push(watcher);
  return { status, watcher };
}

beforeEach(() => {
  browser = Object.assign(new EventTarget(), {
    localStorage: { setItem: vi.fn() },
    setTimeout,
    clearTimeout,
  });
  page = Object.assign(new EventTarget(), { visibilityState: "visible" });
  vi.stubGlobal("window", browser);
  vi.stubGlobal("document", page);
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => validResponse());
});
afterEach(() => {
  for (const watcher of watchers.splice(0)) watcher.stop();
  vi.unstubAllGlobals();
});

describe("cross-tab account session invalidation", () => {
  it("detects expiry in a foreground tab without focus or navigation", async () => {
    vi.useFakeTimers();
    Object.assign(browser, { setTimeout, clearTimeout });
    try {
      const { status } = start();
      await vi.advanceTimersByTimeAsync(0);
      expect(status).toHaveBeenLastCalledWith("valid");
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
      await vi.advanceTimersByTimeAsync(30000);
      expect(status).toHaveBeenLastCalledWith("invalid");
    } finally {
      for (const watcher of watchers.splice(0)) watcher.stop();
      vi.useRealTimers();
    }
  });
  it("validates the cookie without using browser caches before displaying account details", async () => {
    const { status } = start();
    expect(status).toHaveBeenLastCalledWith("checking");
    await vi.waitFor(() => expect(status).toHaveBeenLastCalledWith("valid"));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/me",
      expect.objectContaining({
        cache: "no-store",
        credentials: "same-origin",
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("immediately invalidates another tab on a logout signal", async () => {
    const { status } = start();
    await vi.waitFor(() => expect(status).toHaveBeenLastCalledWith("valid"));
    browser.dispatchEvent(
      Object.assign(new Event("storage"), {
        key: logoutStorageKey,
        newValue: "notification-only",
      }),
    );
    expect(status).toHaveBeenLastCalledWith("invalid");
    const count = fetchMock.mock.calls.length;
    browser.dispatchEvent(new Event("focus"));
    expect(fetchMock).toHaveBeenCalledTimes(count);
  });

  it("does not restore stale details when an older request completes after logout", async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { status } = start();
    browser.dispatchEvent(
      Object.assign(new Event("storage"), {
        key: logoutStorageKey,
        newValue: "logout",
      }),
    );
    resolveRequest?.(validResponse());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(status).toHaveBeenLastCalledWith("invalid");
    expect(status).not.toHaveBeenCalledWith("valid");
  });

  it("hides background content and checks again when the tab becomes visible", async () => {
    const { status } = start();
    await vi.waitFor(() => expect(status).toHaveBeenLastCalledWith("valid"));
    page.visibilityState = "hidden";
    page.dispatchEvent(new Event("visibilitychange"));
    expect(status).toHaveBeenLastCalledWith("checking");
    fetchMock.mockImplementation(
      async () => new Response(null, { status: 401 }),
    );
    page.visibilityState = "visible";
    page.dispatchEvent(new Event("visibilitychange"));
    await vi.waitFor(() => expect(status).toHaveBeenLastCalledWith("invalid"));
  });

  it("revalidates on focus and history restoration when storage notifications are unavailable", async () => {
    const { status } = start();
    await vi.waitFor(() => expect(status).toHaveBeenLastCalledWith("valid"));
    browser.dispatchEvent(new Event("pageshow"));
    await vi.waitFor(() => expect(status).toHaveBeenLastCalledWith("valid"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockImplementation(
      async () => new Response(null, { status: 401 }),
    );
    browser.dispatchEvent(new Event("focus"));
    await vi.waitFor(() => expect(status).toHaveBeenLastCalledWith("invalid"));
  });

  it("discards the rendered identity if another account has replaced its session", async () => {
    fetchMock.mockImplementation(async () => validResponse("user-b"));
    const { status } = start();
    await vi.waitFor(() => expect(status).toHaveBeenLastCalledWith("invalid"));
  });

  it("hides details on connection failure and allows an explicit retry", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Offline"));
    const { status, watcher } = start();
    await vi.waitFor(() =>
      expect(status).toHaveBeenLastCalledWith("unavailable"),
    );
    await watcher.check();
    expect(status).toHaveBeenLastCalledWith("valid");
  });

  it("removes listeners on unmount and ignores unrelated storage updates", async () => {
    const { status, watcher } = start();
    await vi.waitFor(() => expect(status).toHaveBeenLastCalledWith("valid"));
    browser.dispatchEvent(
      Object.assign(new Event("storage"), {
        key: "unrelated",
        newValue: "value",
      }),
    );
    expect(status).toHaveBeenLastCalledWith("valid");
    watcher.stop();
    const count = fetchMock.mock.calls.length;
    browser.dispatchEvent(new Event("focus"));
    browser.dispatchEvent(new Event("pageshow"));
    expect(fetchMock).toHaveBeenCalledTimes(count);
  });

  it("publishes only a notification marker and tolerates blocked storage", () => {
    notifyOtherTabsOfLogout();
    expect(browser.localStorage.setItem).toHaveBeenCalledWith(
      logoutStorageKey,
      expect.stringMatching(/^[\da-f-]{36}$/),
    );
    browser.localStorage.setItem.mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    expect(() => notifyOtherTabsOfLogout()).not.toThrow();
  });
});
