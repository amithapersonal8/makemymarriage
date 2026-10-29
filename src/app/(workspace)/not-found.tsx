import Link from "next/link";

export default function WeddingNotFound() {
  return (
    <section className="wedding-card wedding-empty">
      <h1>Wedding not found</h1>
      <p>This wedding is unavailable or you don’t have access to it.</p>
      <Link href="/weddings" className="button">
        Back to your weddings
      </Link>
    </section>
  );
}
