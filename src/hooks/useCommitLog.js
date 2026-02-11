import useSWR from "swr";
import * as R from "ramda";
import { invoke } from "../lib/tauri";
import { SWR_KEYS } from "../lib/swr";

const fetchCommitLog = (repoPath, startOid, limit) =>
  invoke("get_commit_log", { repoPath, startOid, limit });

export function useCommitLog(repoPath, cursor, limit = 50) {
  const { data, error, isLoading } = useSWR(
    R.isNil(repoPath) ? null : SWR_KEYS.COMMIT_LOG(repoPath, cursor),
    () => fetchCommitLog(repoPath, cursor, limit),
  );

  return {
    commits: R.pathOr([], ["commits"], data),
    hasMore: R.pathOr(false, ["has_more"], data),
    nextCursor: R.pathOr(null, ["cursor"], data),
    error,
    isLoading,
  };
}
