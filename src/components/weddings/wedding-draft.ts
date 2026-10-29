import type { WeddingInput } from "@/modules/weddings/wedding.schema";

export type WeddingDraft = {
  values: WeddingInput;
  customTitle: boolean;
  undecided: boolean;
};

// Tab-local memory only: never persist wedding details or identity in browser storage.
export function createWeddingDraftStore() {
  let owner: string | undefined;
  let latest: string | undefined;
  const drafts = new Map<string, WeddingDraft>();
  function clear() {
    owner = undefined;
    latest = undefined;
    drafts.clear();
  }
  return {
    hasDraft: () => drafts.size > 0,
    save(userId: string, path: string, draft: WeddingDraft) {
      if (!/^\/weddings\/(new|[a-f\d]{24}\/edit)$/.test(path)) return;
      if (owner !== userId) clear();
      owner = userId;
      latest = path;
      drafts.set(path, { ...draft, values: { ...draft.values } });
    },
    read(userId: string, path: string) {
      if (owner !== userId) return undefined;
      const draft = drafts.get(path);
      return draft ? { ...draft, values: { ...draft.values } } : undefined;
    },
    remove(userId: string, path: string) {
      if (owner !== userId) return;
      drafts.delete(path);
      latest = [...drafts.keys()].at(-1);
      if (!drafts.size) clear();
    },
    resume(userId: string) {
      if (owner !== userId) {
        clear();
        return undefined;
      }
      return latest;
    },
  };
}
