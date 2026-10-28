import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/components/layout/brand";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="auth-header">
        <Brand />
        <Link href="/" className="auth-back">
          ← Back to home
        </Link>
      </header>
      <main id="main-content" tabIndex={-1} className="auth-main">
        {children}
      </main>
      <footer className="auth-footer">
        <span>© {new Date().getFullYear()} Make My Marriage</span>
        <span>One wedding. Your people. All together.</span>
      </footer>
    </div>
  );
}

export function AuthStory() {
  return (
    <aside
      className="auth-story"
      aria-label="A shared space for your celebration"
    >
      <p className="eyebrow">The wedding planning workspace</p>
      <h2>
        Less coordinating.
        <br />
        <em>More celebrating.</em>
      </h2>
      <p>
        For your many ceremonies, your favourite people, and all the little
        details. A shared space for the way India celebrates.
      </p>
      <div className="auth-story-card">
        <span className="eyebrow">One wedding. Many beautiful moments.</span>
        <h3>Every celebration belongs here.</h3>
        <div className="auth-ceremonies">
          <span>Mehendi</span>
          <span>Haldi</span>
          <span>Sangeet</span>
          <span>Wedding</span>
          <span>Reception</span>
        </div>
        <div className="auth-story-notes">
          <p>
            <span>01</span> Make space for every tradition
          </p>
          <p>
            <span>02</span> Bring both families into the plan
          </p>
          <p>
            <span>03</span> Keep the little details together
          </p>
        </div>
      </div>
      <p className="auth-story-quote">
        “A little structure behind the scenes.
        <br />A little more presence in every moment.”
      </p>
    </aside>
  );
}
