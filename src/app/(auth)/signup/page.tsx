import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthStory } from "@/components/auth/auth-shell";
import { currentUser } from "@/modules/auth/current-user";

export const metadata: Metadata = {
  title: "Create an account | Make My Marriage",
};
export default async function SignupPage() {
  const user = await currentUser().catch(() => null);
  if (user) redirect("/account");
  return (
    <div className="auth-grid">
      <section className="auth-form-section">
        <div className="auth-form-content">
          <p className="eyebrow">A beautiful beginning</p>
          <h1>Let’s plan it, together.</h1>
          <p className="auth-intro">
            Create your account. There’s a place for every celebration, and
            everyone who matters.
          </p>
          <AuthForm mode="signup" />
        </div>
      </section>
      <AuthStory />
    </div>
  );
}
