import useSWR from "swr";
import * as R from "ramda";
import { invoke } from "../lib/tauri";
import { SWR_KEYS } from "../lib/swr";

const fetchCommitDag = (repoPath, maxCommits) =>
  invoke("get_commit_dag", { repoPath, maxCommits });

export function useCommitDag(repoPath, maxCommits = 200) {
  const { data, error, isLoading } = useSWR(
    R.isNil(repoPath) ? null : SWR_KEYS.COMMIT_DAG(repoPath),
    () => fetchCommitDag(repoPath, maxCommits),
  );

  return {
    nodes: R.pathOr([], ["nodes"], data),
    edges: R.pathOr([], ["edges"], data),
    error,
    isLoading,
  };
}
