export default function HomePage() {
  return (
    <section aria-labelledby="welcome-heading" className="max-w-2xl">
      <p className="mb-5 text-sm font-semibold tracking-widest text-rose-800 uppercase">
        Make My Marriage
      </p>
      <h1
        id="welcome-heading"
        className="text-4xl leading-tight font-semibold tracking-tight text-stone-900 sm:text-6xl"
      >
        A shared space for your wedding journey.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600">
        Bring your celebrations, plans, and family together. We’re getting
        things ready.
      </p>
      <p className="mt-8 inline-block rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600">
        Wedding planning features are coming soon
      </p>
    </section>
  );
}
