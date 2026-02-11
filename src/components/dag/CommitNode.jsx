import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useAtomValue } from "jotai";
import * as R from "ramda";
import { selectedCommitOidAtom } from "../../atoms/uiAtoms";

const refTypeToClass = R.cond([
  [R.equals("LocalBranch"), R.always("ref-badge-branch")],
  [R.equals("RemoteBranch"), R.always("ref-badge-remote")],
  [R.equals("Tag"), R.always("ref-badge-tag")],
  [R.T, R.always("ref-badge-branch")],
]);

const RefBadge = ({ refInfo }) => (
  <span className={`ref-badge ${refTypeToClass(R.prop("ref_type", refInfo))}`}>
    {R.prop("name", refInfo)}
  </span>
);

const CommitNode = memo(({ data }) => {
  const selectedOid = useAtomValue(selectedCommitOidAtom);
  const isSelected = R.equals(selectedOid, R.prop("oid", data));
  const refs = R.propOr([], "refs", data);
  const firstLine = R.pipe(R.propOr("", "message"), R.split("\n"), R.head)(data);

  return (
    <div className={`commit-node ${isSelected ? "commit-node-selected" : ""}`}>
      <Handle type="target" position={Position.Top} className="commit-handle" />
      <div className="commit-node-header">
        <span className="commit-node-oid">{R.prop("short_oid", data)}</span>
        <span className="commit-node-author">{R.prop("author_name", data)}</span>
      </div>
      <div className="commit-node-message" title={firstLine}>
        {firstLine}
      </div>
      {R.not(R.isEmpty(refs)) && (
        <div className="commit-node-refs">
          {R.map(
            (ref) => <RefBadge key={R.prop("full_name", ref)} refInfo={ref} />,
            refs,
          )}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="commit-handle" />
    </div>
  );
});

CommitNode.displayName = "CommitNode";

export default CommitNode;
