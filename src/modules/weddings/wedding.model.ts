import "server-only";
import mongoose, { Schema, type Types } from "mongoose";
import type { WeddingInput } from "./wedding.schema";
import type { WeddingRole } from "./wedding.dto";

const weddingSchema = new Schema<WeddingInput>(
  {
    brideName: { type: String, required: true, maxlength: 100 },
    groomName: { type: String, required: true, maxlength: 100 },
    title: { type: String, required: true, maxlength: 160 },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    location: { type: String, default: "", maxlength: 200 },
    timezone: { type: String, required: true },
    description: { type: String, default: "", maxlength: 2000 },
  },
  { timestamps: true, strict: "throw", collection: "weddings" },
);

export type WeddingMember = {
  weddingId: Types.ObjectId;
  userId: Types.ObjectId;
  role: WeddingRole;
  joinedAt: Date;
};
const memberSchema = new Schema<WeddingMember>(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    role: { type: String, enum: ["OWNER", "ADMIN", "MANAGER"], required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, strict: "throw", collection: "wedding_members" },
);
memberSchema.index({ weddingId: 1, userId: 1 }, { unique: true });
memberSchema.index({ userId: 1, weddingId: 1 });
export const WeddingModel = mongoose.models.Wedding
  ? mongoose.model<WeddingInput>("Wedding")
  : mongoose.model<WeddingInput>("Wedding", weddingSchema);
export const WeddingMemberModel = mongoose.models.WeddingMember
  ? mongoose.model<WeddingMember>("WeddingMember")
  : mongoose.model<WeddingMember>("WeddingMember", memberSchema);
