import "server-only";
import { AppError } from "@/lib/http/app-error";
import type { AccountUser } from "@/modules/auth/auth.dto";
import { weddingSchema, type WeddingInput } from "./wedding.schema";
import type { WeddingDto, WeddingRole } from "./wedding.dto";
import * as repository from "./wedding.repository";

function requireUser(user: AccountUser | null) {
  if (!user)
    throw new AppError(401, "UNAUTHENTICATED", "Please log in to continue.");
  return user;
}
const missing = () =>
  new AppError(404, "NOT_FOUND", "This wedding could not be found.");
function project(
  wedding: WeddingInput & { _id: { toString(): string } },
  role: WeddingRole,
): WeddingDto {
  return {
    id: wedding._id.toString(),
    title: wedding.title,
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    startDate: wedding.startDate,
    endDate: wedding.endDate,
    location: wedding.location,
    timezone: wedding.timezone,
    description: wedding.description,
    role,
  };
}
async function authorizedMembership(user: AccountUser | null, id: string) {
  const account = requireUser(user);
  if (!/^[a-f\d]{24}$/i.test(id)) throw missing();
  await repository.prepareWeddingDatabase();
  const membership = await repository.findMembership(account.id, id);
  if (!membership) throw missing();
  return membership;
}
export async function createWedding(user: AccountUser | null, input: unknown) {
  const account = requireUser(user);
  const data = weddingSchema.parse(input);
  await repository.prepareWeddingDatabase();
  return project(await repository.createWithOwner(account.id, data), "OWNER");
}
export async function listWeddings(user: AccountUser | null) {
  const account = requireUser(user);
  await repository.prepareWeddingDatabase();
  const { memberships, weddings } = await repository.listForUser(account.id);
  return weddings.flatMap((w) => {
    const member = memberships.find(
      (m) => m.weddingId.toString() === w._id.toString(),
    );
    return member ? [project(w, member.role)] : [];
  });
}
export async function getWedding(user: AccountUser | null, id: string) {
  const member = await authorizedMembership(user, id);
  const wedding = await repository.findWedding(id);
  if (!wedding) throw missing();
  return project(wedding, member.role);
}
export async function editWedding(
  user: AccountUser | null,
  id: string,
  input: unknown,
) {
  const member = await authorizedMembership(user, id);
  // This slice exposes metadata editing to the creator/Owner only.
  if (member.role !== "OWNER")
    throw new AppError(
      403,
      "FORBIDDEN",
      "Only the wedding Owner can edit these details.",
    );
  const data = weddingSchema.parse(input);
  const wedding = await repository.updateWedding(id, data);
  if (!wedding) throw missing();
  return project(wedding, member.role);
}
