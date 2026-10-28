import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { currentUser } from "@/modules/auth/current-user";

export const metadata: Metadata = {
  title: "Your account | Make My Marriage",
  robots: { index: false, follow: false },
};
export default async function AccountPage() {
  let user;
  try {
    user = await currentUser();
  } catch {
    return (
      <section className="account-section">
        <div className="account-card">
          <p className="eyebrow">A brief pause</p>
          <h1>We can’t reach your account.</h1>
          <p>
            Your account hasn’t been opened. Please refresh in a moment to try
            again.
          </p>
          <a className="button" href="/account">
            Try again
          </a>
        </div>
      </section>
    );
  }
  if (!user) redirect("/login");
  return (
    <section className="account-section">
      <div className="account-card">
        <span className="account-monogram" aria-hidden="true">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <p className="eyebrow">You’re in good company</p>
        <h1>Welcome, {user.name}.</h1>
        <p>
          You’re signed in as <strong>{user.email}</strong>.
        </p>
        <div className="account-next">
          <h2>Your wedding story comes next.</h2>
          <p>
            Your account is ready. Wedding setup is the next feature we’re
            building. There’s nothing else you need to fill in today.
          </p>
        </div>
        <LogoutButton />
      </div>
    </section>
  );
}
