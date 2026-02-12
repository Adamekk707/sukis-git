import { atom } from "jotai";

export const sidebarOpenAtom = atom(true);

export const selectedCommitOidAtom = atom(null);

export const diffViewTypeAtom = atom("unified");

export const activeModalAtom = atom(null);

export const cloneModalRepoAtom = atom(null);

export const addRepoModalOpenAtom = atom(false);
