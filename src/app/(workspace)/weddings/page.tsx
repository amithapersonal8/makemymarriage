import Link from "next/link";
import { currentUser } from "@/modules/auth/current-user";
import { listWeddings } from "@/modules/weddings/wedding.service";
import { WeddingSummary } from "@/components/weddings/wedding-summary";

export default async function WeddingsPage() {
  const user = await currentUser();
  const weddings = await listWeddings(user);
  return (
    <>
      <div className="wedding-page-heading">
        <div>
          <p className="eyebrow">Your shared planning spaces</p>
          <h1>Your weddings</h1>
          <p>A little structure for your celebrations, all in one place.</p>
        </div>
        {weddings.length > 0 && (
          <Link href="/weddings/new" className="button button-outline">
            + Create another wedding
          </Link>
        )}
      </div>
      {weddings.length ? (
        <div className="wedding-list">
          {weddings.map((wedding) => (
            <WeddingSummary key={wedding.id} wedding={wedding} />
          ))}
        </div>
      ) : (
        <section className="wedding-card wedding-empty">
          <span className="wedding-empty-art" aria-hidden="true">
            ♡
          </span>
          <p className="eyebrow">Every celebration starts somewhere</p>
          <h2>Welcome, {user?.name}.</h2>
          <p>
            You haven’t created a wedding space yet. Start with your names and
            make room for your celebration.
          </p>
          <Link href="/weddings/new" className="button">
            + Create your wedding
          </Link>
          <p className="wedding-help">
            Dates and location can be decided later.
          </p>
        </section>
      )}
    </>
  );
}
