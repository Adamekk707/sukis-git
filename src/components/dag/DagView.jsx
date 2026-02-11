import { useRef } from "react";
import { useAtomValue } from "jotai";
import { useStore } from "@nanostores/react";
import * as R from "ramda";
import { selectedCommitOidAtom } from "../../atoms/uiAtoms";
import { useRepository } from "../../context/RepositoryContext";
import { useCommitDag } from "../../hooks/useCommitDag";
import { useResizeHandle } from "../../hooks/useResizeHandle";
import { messages } from "../../i18n";
import { CommitListTable } from "./CommitListTable";
import { CommitDetailPanel } from "./CommitDetailPanel";

const DEFAULT_DETAIL_HEIGHT = 300;

export function DagView() {
  const t = useStore(messages);
  const { selectedRepoPath } = useRepository();
  const { nodes, edges, isLoading, error } = useCommitDag(selectedRepoPath);
  const selectedOid = useAtomValue(selectedCommitOidAtom);

  const containerRef = useRef(null);
  const detailRef = useRef(null);
  const { handlePointerDown } = useResizeHandle({
    direction: "vertical",
    containerRef,
    targetRef: detailRef,
    initialSize: DEFAULT_DETAIL_HEIGHT,
  });

  const hasDetail = R.not(R.isNil(selectedOid));

  const content = R.cond([
    [() => isLoading, () => (
      <div className="dag-loading">
        <p>{R.pathOr("Loading...", ["common", "loading"], t)}</p>
      </div>
    )],
    [() => R.not(R.isNil(error)), () => (
      <div className="dag-error">
        <p>{R.pathOr("An error occurred", ["common", "error"], t)}</p>
      </div>
    )],
    [R.T, () => (
      <div className="dag-view" ref={containerRef}>
        <div className="dag-graph-area">
          <CommitListTable dagNodes={nodes} dagEdges={edges} />
        </div>
        {hasDetail && (
          <>
            <div className="resize-handle resize-handle-horizontal" onPointerDown={handlePointerDown} />
            <div className="dag-detail-area" ref={detailRef}>
              <CommitDetailPanel />
            </div>
          </>
        )}
      </div>
    )],
  ])();

  return content;
}
