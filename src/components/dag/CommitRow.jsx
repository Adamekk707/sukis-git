import { memo, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import * as R from "ramda";
import { selectedCommitOidAtom } from "../../atoms/uiAtoms";
import { formatRelativeTime } from "../../lib/relativeTime";
import { RefBadge } from "./RefBadge";

const ROW_HEIGHT = 32;

export const CommitRow = memo(function CommitRow({ node, index, graphWidth }) {
  const selectedOid = useAtomValue(selectedCommitOidAtom);
  const setSelectedOid = useSetAtom(selectedCommitOidAtom);

  const oid = R.prop("oid", node);
  const isSelected = R.equals(selectedOid, oid);
  const firstLine = R.pipe(R.propOr("", "message"), R.split("\n"), R.head)(node);
  const refs = R.propOr([], "refs", node);

  const handleClick = useCallback(() => setSelectedOid(oid), [setSelectedOid, oid]);

  return (
    <div
      className={`commit-row ${isSelected ? "commit-row-selected" : ""}`}
      style={{ height: ROW_HEIGHT, top: index * ROW_HEIGHT }}
      onClick={handleClick}
    >
      <div className="commit-row-graph-spacer" style={{ width: graphWidth }} />
      <div className="commit-row-message">
        {R.not(R.isEmpty(refs)) &&
          R.map(
            (ref) => <RefBadge key={R.prop("full_name", ref)} refInfo={ref} />,
            refs,
          )}
        <span className="commit-row-text" title={firstLine}>{firstLine}</span>
      </div>
      <div className="commit-row-author" title={R.prop("author_name", node)}>
        {R.prop("author_name", node)}
      </div>
      <div className="commit-row-time">
        {formatRelativeTime(R.prop("timestamp", node))}
      </div>
      <div className="commit-row-oid">
        {R.prop("short_oid", node)}
      </div>
    </div>
  );
});
