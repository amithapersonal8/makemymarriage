import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { AppError } from "@/lib/http/app-error";
import { currentUser } from "@/modules/auth/current-user";
import { getWedding } from "@/modules/weddings/wedding.service";
import { WeddingForm } from "@/components/weddings/wedding-form";

export default async function EditWeddingPage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  const user = await currentUser();
  if (!user) redirect("/login");
  const wedding = await getWedding(user, weddingId).catch((error) => {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  });
  if (wedding.role !== "OWNER") notFound();
  const timezones = [
    ...new Set([
      "Asia/Kolkata",
      "UTC",
      wedding.timezone,
      ...Intl.supportedValuesOf("timeZone"),
    ]),
  ];
  return (
    <div className="wedding-form-page">
      <Link href={`/weddings/${wedding.id}`} className="wedding-back">
        ← Back to your wedding
      </Link>
      <div className="wedding-page-heading">
        <div>
          <h1>Edit wedding details</h1>
          <p>
            Update the details of your celebration. Your changes are saved
            directly to your wedding space.
          </p>
        </div>
      </div>
      <WeddingForm
        key={user.id + wedding.id}
        userId={user.id}
        wedding={wedding}
        timezones={timezones}
      />
    </div>
  );
}
