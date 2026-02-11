export const SWR_KEYS = {
  USB_DEVICES: "usb-devices",
  REFS: (repoPath) => `refs:${repoPath}`,
  COMMIT_LOG: (repoPath, cursor) => `commit-log:${repoPath}:${cursor || "head"}`,
  COMMIT_DAG: (repoPath) => `commit-dag:${repoPath}`,
  COMMIT_DETAIL: (repoPath, oid) => `commit-detail:${repoPath}:${oid}`,
  DIFF: (repoPath, oid) => `diff:${repoPath}:${oid}`,
};

export const swrConfig = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
};
