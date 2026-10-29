"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createWeddingDraftStore, type WeddingDraft } from "./wedding-draft";

type DraftContext = {
  hasDraft: boolean;
  read: ReturnType<typeof createWeddingDraftStore>["read"];
  save: (userId: string, path: string, draft: WeddingDraft) => void;
  remove: (userId: string, path: string) => void;
  resume: (userId: string) => string | undefined;
};
const Context = createContext<DraftContext | null>(null);
export function WeddingDraftProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createWeddingDraftStore);
  const [hasDraft, setHasDraft] = useState(false);
  const [api] = useState(() => ({
    read: store.read,
    save(userId: string, path: string, draft: WeddingDraft) {
      store.save(userId, path, draft);
      setHasDraft(store.hasDraft());
    },
    remove(userId: string, path: string) {
      store.remove(userId, path);
      setHasDraft(store.hasDraft());
    },
    resume(userId: string) {
      const path = store.resume(userId);
      setHasDraft(store.hasDraft());
      return path;
    },
  }));
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!store.hasDraft()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [store]);
  return (
    <Context.Provider value={{ ...api, hasDraft }}>{children}</Context.Provider>
  );
}
export function useWeddingDrafts() {
  const value = useContext(Context);
  if (!value) throw new Error("Wedding drafts require their provider.");
  return value;
}
export function WeddingDraftNotice() {
  const { hasDraft } = useWeddingDrafts();
  return hasDraft ? (
    <p className="wedding-draft-notice" role="status">
      Your unsaved wedding details are kept in this tab. Sign in with the same
      account to continue. Refreshing or closing this tab discards the draft.
    </p>
  ) : null;
}
