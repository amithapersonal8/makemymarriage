import Link from "next/link";
import { WeddingForm } from "@/components/weddings/wedding-form";
import { currentUser } from "@/modules/auth/current-user";
import { redirect } from "next/navigation";

export default async function NewWeddingPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const timezones = [
    ...new Set(["Asia/Kolkata", "UTC", ...Intl.supportedValuesOf("timeZone")]),
  ];
  return (
    <div className="wedding-form-page">
      <Link href="/weddings" className="wedding-back">
        ← Back to your weddings
      </Link>
      <div className="wedding-page-heading">
        <div>
          <h1>Create your wedding</h1>
          <p>
            Set up your shared space. You’ll automatically become the wedding
            Owner. Dates and location can be decided or changed anytime.
          </p>
        </div>
      </div>
      <WeddingForm key={user.id} userId={user.id} timezones={timezones} />
    </div>
  );
}
