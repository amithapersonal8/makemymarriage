"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notifyOtherTabsOfLogout } from "@/components/auth/session-sync";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Logout failed");
      notifyOtherTabsOfLogout();
      router.replace("/login");
      router.refresh();
    } catch {
      setError("We couldn’t log you out. Please try again.");
      setPending(false);
    }
  }
  return (
    <div>
      <button
        className="button"
        type="button"
        disabled={pending}
        onClick={logout}
      >
        {pending ? "Logging out…" : "Log out"}
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
