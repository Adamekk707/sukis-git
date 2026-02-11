import * as R from "ramda";

const refTypeToClass = R.cond([
  [R.equals("LocalBranch"), R.always("ref-badge-branch")],
  [R.equals("RemoteBranch"), R.always("ref-badge-remote")],
  [R.equals("Tag"), R.always("ref-badge-tag")],
  [R.T, R.always("ref-badge-branch")],
]);

export function RefBadge({ refInfo }) {
  return (
    <span className={`ref-badge ${refTypeToClass(R.prop("ref_type", refInfo))}`}>
      {R.prop("name", refInfo)}
    </span>
  );
}
