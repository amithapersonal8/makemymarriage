import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/modules/auth/current-user";
import { SessionGuard } from "@/components/auth/session-guard";
import { LogoutButton } from "@/components/auth/logout-button";
import "../(auth)/auth.css";
import "./weddings.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata: Metadata = {
  title: "Your weddings | Make My Marriage",
  robots: { index: false, follow: false },
};
export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <SessionGuard key={user.id} userId={user.id}>
      <div className="wedding-shell">
        <a href="#workspace-main" className="skip-link">
          Skip to content
        </a>
        <header className="wedding-header">
          <Link href="/" className="wedding-brand">
            Make My Marriage
          </Link>
          <Link href="/weddings" className="wedding-nav">
            Your weddings
          </Link>
          <details className="wedding-account">
            <summary>
              <span className="wedding-user-initial" aria-hidden="true">
                {Array.from(user.name)[0]}
              </span>
              <span>{user.name}</span>
            </summary>
            <div className="wedding-account-menu">
              <p>{user.email}</p>
              <LogoutButton />
            </div>
          </details>
        </header>
        <main id="workspace-main" tabIndex={-1} className="wedding-main">
          {children}
        </main>
        <footer className="wedding-footer">
          © {new Date().getFullYear()} Make My Marriage{" "}
          <span>One wedding. Your people. All together.</span>
        </footer>
      </div>
    </SessionGuard>
  );
}
