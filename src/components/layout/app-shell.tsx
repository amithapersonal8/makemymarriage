import Link from "next/link";
import type { ReactNode } from "react";

import { Brand } from "@/components/layout/brand";
import { MobileNavigation } from "@/components/layout/mobile-navigation";

const navigation = [
  ["Features", "/#features"],
  ["For families", "/#families"],
  ["How it works", "/#how-it-works"],
  ["FAQs", "/#faqs"],
] as const;

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
            <Link href="/login" className="button button-small login-button">
              Log in
            </Link>
            <Link href="/signup" className="button button-small">
              Get started
            </Link>
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
            <Link href="/#features">Planning tools</Link>
            <Link href="/#families">For your family</Link>
            <Link href="/#guest-experience">For your guests</Link>
          </div>
          <div>
            <p className="eyebrow">Get to know us</p>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#faqs">Common questions</Link>
            <Link href="/#celebrations">Your celebrations</Link>
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
