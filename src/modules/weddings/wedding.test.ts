import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { NextRequest } from "next/server";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { WeddingModel, WeddingMemberModel } from "./wedding.model";
import { prepareWeddingDatabase } from "./wedding.repository";
import {
  createWedding,
  editWedding,
  getWedding,
  listWeddings,
} from "./wedding.service";
import { weddingSchema } from "./wedding.schema";
import { weddingDateLabel } from "./wedding.dto";
import { weddingResponse } from "./wedding.http";
import { SessionModel, UserModel } from "@/modules/auth/auth.model";
import { hashToken } from "@/modules/auth/auth.service";
import { sessionCookieName } from "@/modules/auth/auth.http";

let database: MongoMemoryReplSet;
const owner = {
  id: new mongoose.Types.ObjectId().toString(),
  name: "Ananya",
  email: "ananya@example.test",
};
const stranger = {
  id: new mongoose.Types.ObjectId().toString(),
  name: "Other",
  email: "other@example.test",
};
const input = {
  brideName: " Ananya Sharma ",
  groomName: "Aarav Verma",
  title: "Ananya & Aarav’s wedding",
  timezone: "Asia/Kolkata",
  startDate: "2027-12-12",
  endDate: "2027-12-15",
  location: "Udaipur",
  description: "Our celebration",
};
beforeAll(async () => {
  database = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  vi.stubEnv("MONGODB_URI", database.getUri("wedding_tests"));
  vi.stubEnv("APP_ORIGIN", "http://127.0.0.1:3000");
  await prepareWeddingDatabase();
});
beforeEach(async () => {
  await Promise.all([
    WeddingModel.deleteMany({}),
    WeddingMemberModel.deleteMany({}),
    UserModel.deleteMany({}),
    SessionModel.deleteMany({}),
  ]);
});
afterAll(async () => {
  await mongoose.disconnect();
  await database?.stop();
  vi.unstubAllEnvs();
});
describe("wedding onboarding", () => {
  it("atomically creates the saved wedding and exactly one Owner membership", async () => {
    const wedding = await createWedding(owner, input);
    expect(wedding.brideName).toBe("Ananya Sharma");
    expect(wedding.role).toBe("OWNER");
    expect(
      await WeddingMemberModel.countDocuments({
        weddingId: wedding.id,
        userId: owner.id,
        role: "OWNER",
      }),
    ).toBe(1);
    expect(await getWedding(owner, wedding.id)).toEqual(wedding);
    expect(await listWeddings(owner)).toEqual([wedding]);
  });
  it("rolls back the wedding if initial membership persistence fails", async () => {
    const failure = vi
      .spyOn(WeddingMemberModel, "create")
      .mockRejectedValueOnce(new Error("simulated membership failure"));
    try {
      await expect(createWedding(owner, input)).rejects.toThrow("simulated");
    } finally {
      failure.mockRestore();
    }
    expect(await WeddingModel.countDocuments()).toBe(0);
    expect(await WeddingMemberModel.countDocuments()).toBe(0);
  });
  it("isolates wedding reads, lists and updates from another account", async () => {
    const wedding = await createWedding(owner, input);
    expect(await listWeddings(stranger)).toEqual([]);
    await expect(getWedding(stranger, wedding.id)).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      editWedding(stranger, wedding.id, { ...input, title: "stolen" }),
    ).rejects.toMatchObject({ status: 404 });
    expect((await getWedding(owner, wedding.id)).title).toBe(input.title);
    await expect(getWedding(owner, "invalid-id")).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      getWedding(owner, new mongoose.Types.ObjectId().toString()),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("allows Owner editing and clearing optional details without changing membership", async () => {
    const wedding = await createWedding(owner, input);
    const edited = await editWedding(owner, wedding.id, {
      ...input,
      title: "Updated",
      startDate: "",
      endDate: "",
      location: "",
      description: "",
    });
    expect(edited).toMatchObject({
      title: "Updated",
      startDate: "",
      endDate: "",
      location: "",
      role: "OWNER",
    });
    expect(await WeddingMemberModel.countDocuments()).toBe(1);
  });
  it("denies non-Owner edits and rejects unauthenticated services", async () => {
    const wedding = await createWedding(owner, input);
    await WeddingMemberModel.create({
      weddingId: wedding.id,
      userId: stranger.id,
      role: "MANAGER",
    });
    expect((await getWedding(stranger, wedding.id)).role).toBe("MANAGER");
    await expect(
      editWedding(stranger, wedding.id, input),
    ).rejects.toMatchObject({ status: 403 });
    await expect(createWedding(null, input)).rejects.toMatchObject({
      status: 401,
    });
    await expect(listWeddings(null)).rejects.toMatchObject({ status: 401 });
  });
  it("validates real date-only values, ordered dates, timezone, required names and unknown fields", () => {
    for (const patch of [
      { groomName: " " },
      { title: " " },
      { startDate: "2027-02-29" },
      { startDate: "2027-12-16" },
      { startDate: "", endDate: "2027-12-15" },
      { timezone: "fake/zone" },
      { role: "OWNER" },
      { brideName: { $ne: null } },
      { description: "x".repeat(2001) },
    ])
      expect(weddingSchema.safeParse({ ...input, ...patch }).success).toBe(
        false,
      );
    expect(
      weddingSchema.safeParse({
        ...input,
        startDate: "2028-02-29",
        endDate: "2028-02-29",
      }).success,
    ).toBe(true);
    expect(
      weddingSchema.safeParse({
        brideName: "A",
        groomName: "B",
        title: "Wedding",
        timezone: "Asia/Kolkata",
      }).success,
    ).toBe(true);
    expect(weddingDateLabel("2027-12-12", "2027-12-12")).toBe("12 Dec 2027");
    expect(weddingDateLabel("", "")).toBe("Not decided yet");
  });
  it("requires a valid session and same origin at the HTTP boundary, returns safe no-store projections", async () => {
    const token = "a".repeat(43);
    await UserModel.create({
      _id: owner.id,
      name: owner.name,
      normalizedEmail: owner.email,
      passwordHash: "unused",
    });
    await SessionModel.create({
      userId: owner.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60000),
    });
    function request(
      body: unknown,
      cookie = true,
      origin = "http://127.0.0.1:3000",
    ) {
      return new NextRequest("http://127.0.0.1:3000/api/v1/weddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: origin,
          ...(cookie ? { Cookie: `${sessionCookieName()}=${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
    }
    expect((await weddingResponse(request(input, false))).status).toBe(401);
    const switched = request(input);
    switched.headers.set("x-expected-user-id", stranger.id);
    expect((await weddingResponse(switched)).status).toBe(401);
    expect(await WeddingModel.countDocuments()).toBe(0);
    expect(
      (await weddingResponse(request(input, true, "https://evil.example")))
        .status,
    ).toBe(403);
    expect(
      (await weddingResponse(request({ ...input, role: "ADMIN" }))).status,
    ).toBe(422);
    const response = await weddingResponse(request(input));
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const result = await response.json();
    expect(result.data).toMatchObject({ role: "OWNER", title: input.title });
    expect(result.data).not.toHaveProperty("userId");
    expect(result.data).not.toHaveProperty("__v");
    await SessionModel.updateMany({}, { $set: { revokedAt: new Date() } });
    expect((await weddingResponse(request(input))).status).toBe(401);
  });
});
