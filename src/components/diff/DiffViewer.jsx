import { useAtomValue } from "jotai";
import { useStore } from "@nanostores/react";
import * as R from "ramda";
import { parseDiff, Diff, Hunk } from "react-diff-view";
import { diffViewTypeAtom } from "../../atoms/uiAtoms";
import { messages } from "../../i18n";
import "react-diff-view/style/index.css";

const renderHunks = (hunks) => R.map((hunk) => <Hunk key={R.prop("content", hunk)} hunk={hunk} />, hunks);

const isDevNull = R.equals("/dev/null");

const displayPath = (file) => {
  const oldPath = R.prop("oldPath", file);
  const newPath = R.prop("newPath", file);
  return R.cond([
    [() => R.both(isDevNull, R.complement(R.isNil))(oldPath), R.always(newPath)],
    [() => R.both(isDevNull, R.complement(R.isNil))(newPath), R.always(oldPath)],
    [() => R.equals(oldPath, newPath), R.always(newPath)],
    [R.T, R.always(`${oldPath} → ${newPath}`)],
  ])();
};

const DiffFile = ({ file, viewType }) => (
  <div className="diff-file">
    <div className="diff-file-header">
      {displayPath(file)}
    </div>
    <Diff viewType={viewType} diffType={R.prop("type", file)} hunks={R.propOr([], "hunks", file)}>
      {renderHunks}
    </Diff>
  </div>
);

export function DiffViewer({ diffText }) {
  const t = useStore(messages);
  const viewType = useAtomValue(diffViewTypeAtom);

  const files = R.tryCatch(
    (text) => parseDiff(text),
    R.always([]),
  )(R.defaultTo("", diffText));

  return R.ifElse(
    R.isEmpty,
    () => <div className="diff-empty">{R.pathOr("No changes", ["diff", "noDiff"], t)}</div>,
    R.map((file) => (
      <DiffFile
        key={`${R.prop("oldPath", file)}-${R.prop("newPath", file)}`}
        file={file}
        viewType={viewType}
      />
    )),
  )(files);
}
