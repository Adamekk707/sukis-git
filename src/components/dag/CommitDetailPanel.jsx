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

  const handleClose = () => setSelectedOid(null);

  return (
    <div className="commit-detail-panel">
      <div className="commit-detail-header">
        <span className="commit-detail-oid">{oid}</span>
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
