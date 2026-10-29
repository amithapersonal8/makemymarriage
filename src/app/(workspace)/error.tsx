"use client";
export default function WorkspaceError({ reset }: { reset: () => void }) {
  return (
    <section className="wedding-card wedding-empty" role="alert">
      <h1>We couldn’t load your wedding space.</h1>
      <p>Please check your connection and try again.</p>
      <button type="button" className="button" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
