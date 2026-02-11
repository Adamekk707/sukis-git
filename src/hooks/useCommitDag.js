import useSWR from "swr";
import * as R from "ramda";
import { invoke } from "../lib/tauri";
import { SWR_KEYS } from "../lib/swr";

const fetchCommitDag = (repoPath, maxCommits, branchOid) =>
  invoke("get_commit_dag", {
    repoPath,
    maxCommits,
    branchOid: R.defaultTo(null, branchOid),
  });

export function useCommitDag(repoPath, maxCommits = 200, branchOid = null) {
  const { data, error, isLoading } = useSWR(
    R.isNil(repoPath) ? null : SWR_KEYS.COMMIT_DAG(repoPath, branchOid),
    () => fetchCommitDag(repoPath, maxCommits, branchOid),
  );

  return {
    nodes: R.pathOr([], ["nodes"], data),
    edges: R.pathOr([], ["edges"], data),
    error,
    isLoading,
  };
}
