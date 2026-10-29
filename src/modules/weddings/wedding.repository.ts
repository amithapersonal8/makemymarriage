import "server-only";
import mongoose from "mongoose";
import { connectDatabase } from "@/lib/db/connection";
import { WeddingModel, WeddingMemberModel } from "./wedding.model";
import type { WeddingInput } from "./wedding.schema";

let preparation: Promise<unknown> | undefined;
export async function prepareWeddingDatabase() {
  await connectDatabase();
  if (process.env.NODE_ENV !== "production") {
    preparation ??= Promise.all([
      WeddingModel.createCollection(),
      WeddingMemberModel.createCollection(),
    ])
      .then(() => WeddingMemberModel.createIndexes())
      .catch((error) => {
        preparation = undefined;
        throw error;
      });
    await preparation;
  }
}
export async function createWithOwner(userId: string, input: WeddingInput) {
  return mongoose.connection.transaction(async (session) => {
    const wedding = new WeddingModel(input);
    await wedding.save({ session });
    await WeddingMemberModel.create(
      [{ weddingId: wedding._id, userId, role: "OWNER" }],
      { session },
    );
    return wedding;
  });
}
export function findMembership(userId: string, weddingId: string) {
  return WeddingMemberModel.findOne({ userId, weddingId }).lean().exec();
}
export async function listForUser(userId: string) {
  const memberships = await WeddingMemberModel.find({ userId }).lean().exec();
  const weddings = await WeddingModel.find({
    _id: { $in: memberships.map((m) => m.weddingId) },
  })
    .sort({ createdAt: -1, _id: -1 })
    .lean()
    .exec();
  return { memberships, weddings };
}
export function findWedding(id: string) {
  return WeddingModel.findById(id).lean().exec();
}
export function updateWedding(id: string, input: WeddingInput) {
  return WeddingModel.findByIdAndUpdate(
    id,
    { $set: input },
    { returnDocument: "after", runValidators: true },
  )
    .lean()
    .exec();
}
