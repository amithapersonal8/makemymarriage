import Link from "next/link";
import type { ReactNode } from "react";

import { MobileNavigation } from "@/components/layout/mobile-navigation";

const navigation = [
  ["Features", "#features"],
  ["For families", "#families"],
  ["How it works", "#how-it-works"],
  ["FAQs", "#faqs"],
] as const;

function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Make My Marriage home">
      <span className="brand-mark" aria-hidden="true">
        M
      </span>
      <span>Make My Marriage</span>
    </Link>
  );
}

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            {navigation.map(([label, href]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <button type="button" className="button button-small login-button">
              Log in
            </button>
            <button type="button" className="button button-small">
              Get started
            </button>
          </div>
          <MobileNavigation items={navigation} />
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <Brand />
            <p className="footer-tagline">
              Every celebration, beautifully organized.
            </p>
            <p>
              A little less coordinating.
              <br />A lot more celebrating.
            </p>
          </div>
          <div>
            <p className="eyebrow">Discover</p>
            <a href="#features">Planning tools</a>
            <a href="#families">For your family</a>
            <a href="#guest-experience">For your guests</a>
          </div>
          <div>
            <p className="eyebrow">Get to know us</p>
            <a href="#how-it-works">How it works</a>
            <a href="#faqs">Common questions</a>
            <a href="#celebrations">Your celebrations</a>
          </div>
          <div className="footer-note">
            <p className="eyebrow">Made for your moments</p>
            <p>
              One wedding. Multiple events.
              <br />
              One shared planning space.
            </p>
            <span className="made-with">
              Thoughtfully made for Indian weddings.
            </span>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Make My Marriage</span>
          <span>With love, for the whole family.</span>
        </div>
      </footer>
    </>
  );
}
