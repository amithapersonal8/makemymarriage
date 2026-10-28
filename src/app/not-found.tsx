import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

export default function NotFound() {
  return (
    <AppShell>
      <section className="container section not-found">
        <p className="eyebrow">404 · A little off the itinerary</p>
        <h1>This page couldn’t be found.</h1>
        <p>Let’s take you back to where the planning begins.</p>
        <Link className="button" href="/">
          Back to home
        </Link>
      </section>
    </AppShell>
  );
}
