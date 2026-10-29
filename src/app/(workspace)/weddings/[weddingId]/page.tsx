import Link from "next/link";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/http/app-error";
import { currentUser } from "@/modules/auth/current-user";
import { getWedding } from "@/modules/weddings/wedding.service";
import { weddingDateLabel } from "@/modules/weddings/wedding.dto";
import { WeddingMonogram } from "@/components/weddings/wedding-summary";

export default async function WeddingPage({
  params,
  searchParams,
}: {
  params: Promise<{ weddingId: string }>;
  searchParams: Promise<{ created?: string; saved?: string }>;
}) {
  const { weddingId } = await params;
  const flags = await searchParams;
  const wedding = await getWedding(await currentUser(), weddingId).catch(
    (error) => {
      if (error instanceof AppError && error.status === 404) notFound();
      throw error;
    },
  );
  return (
    <>
      {(flags.created === "1" || flags.saved === "1") && (
        <div className="wedding-success" role="status">
          <strong>
            {flags.created === "1"
              ? "Your wedding space is ready."
              : "Your wedding details have been saved."}
          </strong>
          <p>
            {flags.created === "1"
              ? "More planning tools will follow."
              : "You can update them again anytime."}
          </p>
        </div>
      )}
      <Link href="/weddings" className="wedding-back">
        ← Back to your weddings
      </Link>
      <div className="wedding-page-heading wedding-overview-heading">
        <WeddingMonogram wedding={wedding} />
        <div>
          <span className="wedding-role">
            {wedding.role === "OWNER"
              ? "Owner"
              : wedding.role === "ADMIN"
                ? "Admin"
                : "Manager"}
          </span>
          <h1>{wedding.title}</h1>
        </div>
        {wedding.role === "OWNER" && (
          <Link
            href={`/weddings/${wedding.id}/edit`}
            className="button button-outline"
          >
            Edit wedding details
          </Link>
        )}
      </div>
      <section className="wedding-card wedding-details">
        <p className="eyebrow">Overview</p>
        <h2>Saved wedding details</h2>
        <dl>
          <div className="wedding-couple-row">
            <dt>The couple</dt>
            <dd>
              <span>
                Bride: <strong>{wedding.brideName}</strong>
              </span>
              <span>
                Groom: <strong>{wedding.groomName}</strong>
              </span>
            </dd>
          </div>
          <div>
            <dt>Celebration dates</dt>
            <dd>{weddingDateLabel(wedding.startDate, wedding.endDate)}</dd>
          </div>
          <div>
            <dt>Primary city or location</dt>
            <dd>{wedding.location || "Not decided yet"}</dd>
          </div>
          <div className="wedding-wide">
            <dt>Timezone</dt>
            <dd>{wedding.timezone}</dd>
          </div>
          <div className="wedding-wide">
            <dt>About the celebration</dt>
            <dd className="wedding-description">
              {wedding.description || "No description added yet."}
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}
