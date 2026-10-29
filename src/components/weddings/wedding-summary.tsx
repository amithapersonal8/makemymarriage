import Link from "next/link";
import {
  weddingDateLabel,
  type WeddingDto,
} from "@/modules/weddings/wedding.dto";

export function WeddingMonogram({ wedding }: { wedding: WeddingDto }) {
  return (
    <span className="wedding-monogram" aria-hidden="true">
      {Array.from(wedding.brideName)[0]}&{Array.from(wedding.groomName)[0]}
    </span>
  );
}
export function WeddingSummary({ wedding }: { wedding: WeddingDto }) {
  return (
    <article className="wedding-card wedding-list-card">
      <WeddingMonogram wedding={wedding} />
      <span className="wedding-role">
        {wedding.role === "OWNER"
          ? "Owner"
          : wedding.role === "ADMIN"
            ? "Admin"
            : "Manager"}
      </span>
      <h2>{wedding.title}</h2>
      <p>{weddingDateLabel(wedding.startDate, wedding.endDate)}</p>
      <p>{wedding.location || "Location not decided yet"}</p>
      <div className="wedding-card-actions">
        <Link className="button" href={`/weddings/${wedding.id}`}>
          Open wedding →
        </Link>
        {wedding.role === "OWNER" && (
          <Link className="wedding-back" href={`/weddings/${wedding.id}/edit`}>
            Edit details
          </Link>
        )}
      </div>
    </article>
  );
}
