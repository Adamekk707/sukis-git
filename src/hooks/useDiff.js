import useSWR from "swr";
import * as R from "ramda";
import { invoke } from "../lib/tauri";
import { SWR_KEYS } from "../lib/swr";

const fetchCommitDiff = (repoPath, oid) =>
  invoke("get_commit_diff_text", { repoPath, oid });

export function useDiff(repoPath, oid) {
  const shouldFetch = R.not(R.or(R.isNil(repoPath), R.isNil(oid)));

  const { data, error, isLoading } = useSWR(
    shouldFetch ? SWR_KEYS.DIFF(repoPath, oid) : null,
    () => fetchCommitDiff(repoPath, oid),
  );

  return {
    diffText: R.defaultTo("", data),
    error,
    isLoading,
  };
}
