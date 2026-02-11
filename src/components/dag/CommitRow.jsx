import { memo, useCallback, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useStore } from "@nanostores/react";
import * as R from "ramda";
import { selectedCommitOidAtom } from "../../atoms/uiAtoms";
import { formatRelativeTime } from "../../lib/relativeTime";
import { messages } from "../../i18n";
import { RefBadge } from "./RefBadge";

const ROW_HEIGHT = 32;

export const CommitRow = memo(function CommitRow({ node, index, graphWidth }) {
  const t = useStore(messages);
  const selectedOid = useAtomValue(selectedCommitOidAtom);
  const setSelectedOid = useSetAtom(selectedCommitOidAtom);
  const [copied, setCopied] = useState(false);

  const oid = R.prop("oid", node);
  const isSelected = R.equals(selectedOid, oid);
  const firstLine = R.pipe(R.propOr("", "message"), R.split("\n"), R.head)(node);
  const refs = R.propOr([], "refs", node);

  const handleClick = useCallback(() => setSelectedOid(oid), [setSelectedOid, oid]);

  const handleCopyOid = useCallback((e) => {
    e.stopPropagation();
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
      </div>
    </div>
  );
});
