import { describe, expect, it } from "vitest";
import { createWeddingDraftStore, type WeddingDraft } from "./wedding-draft";

const draft: WeddingDraft = {
  values: {
    brideName: "Ananya",
    groomName: "",
    title: "Our wedding",
    startDate: "",
    endDate: "",
    timezone: "Asia/Kolkata",
    location: "Udaipur",
    description: "Unsaved note",
  },
  undecided: true,
  customTitle: true,
};
describe("tab-local wedding draft recovery", () => {
  it("retains incomplete details and UI choices for the same authenticated account", () => {
    const store = createWeddingDraftStore();
    store.save("account-a", "/weddings/new", draft);
    expect(store.resume("account-a")).toBe("/weddings/new");
    expect(store.read("account-a", "/weddings/new")).toEqual(draft);
    const copy = store.read("account-a", "/weddings/new");
    if (copy) copy.values.description = "modified elsewhere";
    expect(store.read("account-a", "/weddings/new")?.values.description).toBe(
      "Unsaved note",
    );
  });
  it("never reveals another account's draft and destroys it on account switch", () => {
    const store = createWeddingDraftStore();
    store.save("account-a", "/weddings/new", draft);
    expect(store.read("account-b", "/weddings/new")).toBeUndefined();
    expect(store.resume("account-b")).toBeUndefined();
    expect(store.hasDraft()).toBe(false);
    expect(store.read("account-a", "/weddings/new")).toBeUndefined();
  });
  it("keeps create and different wedding edit drafts separate and clears saved/cancelled drafts", () => {
    const store = createWeddingDraftStore();
    const edit = "/weddings/aaaaaaaaaaaaaaaaaaaaaaaa/edit";
    store.save("account-a", "/weddings/new", draft);
    store.save("account-a", edit, {
      ...draft,
      values: { ...draft.values, title: "Edited wedding" },
    });
    expect(store.resume("account-a")).toBe(edit);
    expect(store.read("account-a", "/weddings/new")?.values.title).toBe(
      "Our wedding",
    );
    store.remove("account-a", edit);
    expect(store.resume("account-a")).toBe("/weddings/new");
    store.remove("account-a", "/weddings/new");
    expect(store.hasDraft()).toBe(false);
  });
  it("has no draft after refresh/new tab and rejects external or unrelated resume paths", () => {
    const store = createWeddingDraftStore();
    store.save("account-a", "//evil.example", draft);
    store.save("account-a", "/weddings/new?redirect=bad", draft);
    expect(store.hasDraft()).toBe(false);
    store.save("account-a", "/weddings/new", draft);
    expect(
      createWeddingDraftStore().read("account-a", "/weddings/new"),
    ).toBeUndefined();
  });
});
