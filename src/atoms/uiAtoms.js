import { atom } from "jotai";

export const sidebarOpenAtom = atom(true);

export const selectedCommitOidAtom = atom(null);

export const diffViewTypeAtom = atom("unified");

export const activeModalAtom = atom(null);
