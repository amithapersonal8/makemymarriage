import { redirect } from "next/navigation";
import { currentUser } from "@/modules/auth/current-user";

// Preserve existing bookmarks while the wedding list becomes the signed-in home.
export default async function AccountPage() {
  const user = await currentUser();
  redirect(user ? "/weddings" : "/login");
}
