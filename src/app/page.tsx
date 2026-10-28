import type { ReactNode } from "react";

import {
  celebrations,
  faqs,
  features,
  guestFeatures,
  members,
  steps,
} from "@/components/home/home-data";
import { Icon } from "@/components/home/icon";
import { WeddingPreview } from "@/components/home/wedding-preview";
import { AppShell } from "@/components/layout/app-shell";

function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

export default function HomePage() {
  return (
    <AppShell>
      <section className="hero section">
        <div className="container">
          <div className="hero-copy">
            <span className="hero-pill">
              <span />
              Your wedding, beautifully organized
            </span>
            <h1>
              Plan your wedding,
              <br className="mobile-break" /> <em>together.</em>
            </h1>
            <p>
              From Mehendi to reception, bring your events, family, guests, and
              plans together in one calm, shared space. Made for the way India
              celebrates.
            </p>
            <div className="hero-actions">
              <a className="button" href="#features">
                Explore the features <Icon name="arrow" />
              </a>
              <a className="text-link" href="#how-it-works">
                See how it works <span aria-hidden="true">↓</span>
              </a>
            </div>
            <p className="hero-footnote">
              Free for couples &amp; families <span>·</span> No guest accounts
              needed
            </p>
          </div>
          <WeddingPreview />
          <p className="preview-caption">
            A glimpse of what you can plan. All names and figures shown are
            illustrative.
          </p>
        </div>
      </section>

      <section className="section challenge-section">
        <div className="container narrow">
          <SectionHeading
            eyebrow="Less chaos. More celebration."
            title="Beautiful celebrations shouldn’t mean complicated planning."
          >
            Big Indian weddings carry enormous joy—and a lot of little details.
            Give them a home beyond scattered chats and spreadsheets.
          </SectionHeading>
          <div className="comparison-grid">
            <div className="comparison-card before">
              <div className="comparison-title">
                <span className="comparison-symbol">−</span>
                <div>
                  <h3>The scattered way</h3>
                  <p>So many plans. So many places.</p>
                </div>
              </div>
              <ul>
                <li>Guest lists spread across spreadsheets and chats</li>
                <li>Unclear tasks and last-minute follow-ups</li>
                <li>Expenses that are hard to piece together</li>
                <li>Event details shared again and again</li>
              </ul>
              <p className="comparison-bottom">
                More coordination. Less time to enjoy it.
              </p>
            </div>
            <div className="comparison-card after">
              <div className="comparison-title">
                <span className="comparison-symbol">
                  <Icon name="sparkle" />
                </span>
                <div>
                  <h3>With Make My Marriage</h3>
                  <p>A shared space for your whole celebration.</p>
                </div>
              </div>
              <ul>
                <li>One place for events, guests, and wedding plans</li>
                <li>Clear tasks, with the right family member assigned</li>
                <li>Budgets and recorded expenses, side by side</li>
                <li>Personalized invitations and event-wise RSVPs</li>
              </ul>
              <p className="comparison-bottom">
                A little more clarity. A lot more together.
              </p>
            </div>
          </div>
          <p className="editorial-quote">
            “One wedding. Every detail. One shared space for both sides of the
            family.”
          </p>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <SectionHeading
            eyebrow="Everything in one place"
            title="Made for the many parts of your big day."
          >
            Thoughtful tools for multi-day celebrations, shared
            responsibilities, and all the details in between.
          </SectionHeading>
          <div className="feature-grid">
            {features.map((feature, index) => (
              <article className="feature-card" key={feature.title}>
                <span className="icon-tile">
                  <Icon name={feature.icon} />
                </span>
                <p className="eyebrow">
                  0{index + 1} · {feature.label}
                </p>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="feature-detail">
                  {feature.detail}
                  <span aria-hidden="true">↗</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section family-section" id="families">
        <div className="container family-grid">
          <div className="family-copy">
            <p className="eyebrow">Better together</p>
            <h2>A celebration planned by everyone who matters.</h2>
            <p>
              Indian weddings are a family affair. Bring both sides together in
              one welcoming space, with a clear part for everyone to play.
            </p>
            <ul className="benefit-list">
              <li>
                <span className="icon-tile">
                  <Icon name="shield" />
                </span>
                <div>
                  <h3>A role for every helping hand</h3>
                  <p>
                    Owner, Admin, and Manager permissions keep responsibilities
                    clear.
                  </p>
                </div>
              </li>
              <li>
                <span className="icon-tile">
                  <Icon name="people" />
                </span>
                <div>
                  <h3>Two families. One shared plan.</h3>
                  <p>
                    Keep event details and planning information in the same
                    place.
                  </p>
                </div>
              </li>
              <li>
                <span className="icon-tile">
                  <Icon name="check" />
                </span>
                <div>
                  <h3>Small tasks, thoughtfully shared</h3>
                  <p>
                    Assign a task, set a due date, and see what still needs a
                    little love.
                  </p>
                </div>
              </li>
            </ul>
          </div>
          <div className="family-preview">
            <div className="panel-heading">
              <span>
                <Icon name="people" />
                Family planning circle
              </span>
              <span className="soft-badge">Sample preview</span>
            </div>
            {members.map((member) => (
              <div className="member-row" key={member.name}>
                <span className="member-avatar">{member.initials}</span>
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.detail}</span>
                </div>
                <span
                  className={`role-badge role-${member.role.toLowerCase()}`}
                >
                  {member.role}
                </span>
              </div>
            ))}
            <div className="family-tasks">
              <p className="eyebrow">A few little things, taken care of</p>
              <p>
                <Icon name="check" />
                Confirm the Mehendi playlist <span>Aarav</span>
              </p>
              <p>
                <Icon name="check" />
                Shortlist photographers <span>Rajiv</span>
              </p>
              <p>
                <span className="empty-check" />
                Choose the Sangeet flowers <span>Kavita</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section celebrations-section" id="celebrations">
        <div className="container">
          <SectionHeading
            eyebrow="Made for Indian weddings"
            title="One wedding. So many beautiful moments."
          >
            Every ritual deserves its own place in the plan. Give each
            celebration a schedule, a venue, and a little personality.
          </SectionHeading>
          <p className="sample-label">An illustrative wedding itinerary</p>
          <div className="celebration-grid">
            {celebrations.map((event) => (
              <article className="celebration-card" key={event.title}>
                <div className="ceremony-art" aria-hidden="true">
                  <span>{event.symbol}</span>
                </div>
                <div className="ceremony-body">
                  <p className="event-time">{event.day}</p>
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <span className="ceremony-venue">{event.venue}</span>
                  <div className="ceremony-theme">
                    <span>A little inspiration</span>
                    {event.theme}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="traditions-note">
            Your traditions belong here.{" "}
            <span>Familiar ceremonies or something entirely your own.</span>
          </p>
        </div>
      </section>

      <section className="section guest-section" id="guest-experience">
        <div className="container">
          <SectionHeading
            eyebrow="Thoughtful, from the first invite"
            title="A warm welcome for every guest."
          >
            No apps to install. No accounts to create. Just simple ways to be
            part of your celebration.
          </SectionHeading>
          <div className="guest-grid">
            {guestFeatures.map((card) => (
              <article className="feature-card" key={card.title}>
                <span className="icon-tile">
                  <Icon name={card.icon} />
                </span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <div className="feature-detail">{card.note}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="container">
          <SectionHeading
            eyebrow="Three simple steps"
            title="From your first plan to your final celebration."
          >
            A little structure behind the scenes. More space to be present for
            the moments that matter.
          </SectionHeading>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <article className="step-card" key={step.title}>
                <span className="step-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="trust-strip">
        <div className="container trust-grid">
          <div>
            <Icon name="heart" />
            <p>
              <strong>Free for couples &amp; families</strong>
              <span>A shared start to your next chapter.</span>
            </p>
          </div>
          <div>
            <Icon name="mail" />
            <p>
              <strong>No guest login needed</strong>
              <span>Simple invitations. Welcoming experiences.</span>
            </p>
          </div>
          <div>
            <Icon name="shield" />
            <p>
              <strong>Your wedding, your circle</strong>
              <span>Planning access for your wedding members.</span>
            </p>
          </div>
        </div>
      </div>

      <section className="section faq-section" id="faqs">
        <div className="container narrow">
          <SectionHeading
            eyebrow="A little clarity"
            title="Frequently asked questions."
          />
          <div className="faq-list">
            {faqs.map((faq) => (
              <details className="faq-item" key={faq.question}>
                <summary>
                  {faq.question}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="closing-section">
        <div className="container">
          <span className="closing-flourish" aria-hidden="true">
            ✳
          </span>
          <p className="eyebrow">Begin with a little togetherness</p>
          <h2>
            Your beautiful beginning starts
            <br className="desktop-break" /> with a little planning.
          </h2>
          <p>
            For the big moments, the little details,
            <br />
            and everyone who makes it your wedding.
          </p>
          <a className="button button-light" href="#features">
            Find your planning possibilities <Icon name="arrow" />
          </a>
          <span className="closing-note">
            One wedding. Your people. All together.
          </span>
        </div>
      </section>
    </AppShell>
  );
}
