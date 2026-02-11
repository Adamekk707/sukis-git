import { useState, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useStore } from "@nanostores/react";
import * as R from "ramda";
import { selectedCommitOidAtom } from "../../atoms/uiAtoms";
import { useRepository } from "../../context/RepositoryContext";
import { useDiff } from "../../hooks/useDiff";
import { messages } from "../../i18n";
import { DiffViewer } from "../diff/DiffViewer";

export function CommitDetailPanel() {
  const t = useStore(messages);
  const oid = useAtomValue(selectedCommitOidAtom);
  const setSelectedOid = useSetAtom(selectedCommitOidAtom);
  const { selectedRepoPath } = useRepository();
  const { diffText, isLoading } = useDiff(selectedRepoPath, oid);
  const [copied, setCopied] = useState(false);

  const handleClose = () => setSelectedOid(null);

  const handleCopyOid = useCallback(() => {
    navigator.clipboard.writeText(oid).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [oid]);

  const copyTitle = R.ifElse(
    R.identity,
    R.always(R.pathOr("Copied!", ["dag", "copiedHash"], t)),
    R.always(R.pathOr("Copy hash", ["dag", "copyHash"], t)),
  )(copied);

  return (
    <div className="commit-detail-panel">
      <div className="commit-detail-header">
        <span className="commit-detail-oid">
          {oid}
          <button
            className={`copy-oid-btn ${copied ? "copy-oid-btn-copied" : ""}`}
            title={copyTitle}
            onClick={handleCopyOid}
          >
            {copied
              ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              : <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M10.5 5.5V3.5C10.5 2.67 9.83 2 9 2H3.5C2.67 2 2 2.67 2 3.5V9C2 9.83 2.67 10.5 3.5 10.5H5.5" stroke="currentColor" strokeWidth="1.5" /></svg>
            }
          </button>
        </span>
        <button className="commit-detail-close" onClick={handleClose}>
          {R.pathOr("Close", ["dag", "closeDetail"], t)}
        </button>
      </div>
      <div className="commit-detail-body">
        {R.ifElse(
          R.identity,
          () => <div className="dag-loading">{R.pathOr("Loading...", ["common", "loading"], t)}</div>,
          () => <DiffViewer diffText={diffText} />,
        )(isLoading)}
      </div>
    </div>
  );
}
