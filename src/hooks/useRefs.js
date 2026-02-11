import useSWR from "swr";
import * as R from "ramda";
import { invoke } from "../lib/tauri";
import { SWR_KEYS } from "../lib/swr";

const fetchRefs = (repoPath) => invoke("list_refs", { repoPath });

export function useRefs(repoPath) {
  const { data, error, isLoading } = useSWR(
    R.isNil(repoPath) ? null : SWR_KEYS.REFS(repoPath),
    () => fetchRefs(repoPath),
  );

  const allRefs = R.defaultTo([], data);

  return {
    branches: R.filter(R.propEq("LocalBranch", "ref_type"), allRefs),
    remoteBranches: R.filter(R.propEq("RemoteBranch", "ref_type"), allRefs),
    tags: R.filter(R.propEq("Tag", "ref_type"), allRefs),
    allRefs,
    error,
    isLoading,
  };
}
