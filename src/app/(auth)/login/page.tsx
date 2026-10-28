import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthStory } from "@/components/auth/auth-shell";
import { currentUser } from "@/modules/auth/current-user";

export const metadata: Metadata = { title: "Log in | Make My Marriage" };
export default async function LoginPage() {
  // A database outage must not make the public login form inaccessible.
  const user = await currentUser().catch(() => null);
  if (user) redirect("/account");
  return (
    <div className="auth-grid">
      <section className="auth-form-section">
        <div className="auth-form-content">
          <p className="eyebrow">Your shared wedding space</p>
          <h1>Welcome back.</h1>
          <p className="auth-intro">
            A little less coordinating. A little more celebrating. Log in to
            your account.
          </p>
          <AuthForm mode="login" />
        </div>
      </section>
      <AuthStory />
    </div>
  );
}
