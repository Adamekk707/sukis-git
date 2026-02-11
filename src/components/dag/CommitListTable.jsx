import { useMemo } from "react";
import { useStore } from "@nanostores/react";
import * as R from "ramda";
import { messages } from "../../i18n";
import { GraphLanesSvg } from "./GraphLanesSvg";
import { CommitRow } from "./CommitRow";

const ROW_HEIGHT = 32;
const LANE_SPACING = 16;
const GRAPH_PADDING = 12;
const MIN_GRAPH_WIDTH = 40;

export function CommitListTable({ dagNodes, dagEdges }) {
  const t = useStore(messages);

  const { oidToIndex, oidToColumn, edgeSegments, maxColumn } = useMemo(() => {
    const indexMap = {};
    const columnMap = {};
    R.addIndex(R.forEach)((node, idx) => {
      indexMap[R.prop("oid", node)] = idx;
      columnMap[R.prop("oid", node)] = R.prop("column", node);
    }, dagNodes);

    const segments = R.reduce((acc, edge) => {
      const fromOid = R.prop("from_oid", edge);
      const toOid = R.prop("to_oid", edge);
      const fromRow = R.prop(fromOid, indexMap);
      const toRow = R.prop(toOid, indexMap);
      const fromCol = R.prop(fromOid, columnMap);
      const toCol = R.prop(toOid, columnMap);

      return R.isNil(fromRow) || R.isNil(toRow)
        ? acc
        : R.append({ fromRow, toRow, fromCol, toCol }, acc);
    }, [], dagEdges);

    const maxCol = R.reduce(
      (mx, node) => R.max(mx, R.prop("column", node)),
      0,
      dagNodes,
    );

    return { oidToIndex: indexMap, oidToColumn: columnMap, edgeSegments: segments, maxColumn: maxCol };
  }, [dagNodes, dagEdges]);

  const graphWidth = R.max(MIN_GRAPH_WIDTH, (maxColumn + 1) * LANE_SPACING + GRAPH_PADDING * 2);
  const totalRows = R.length(dagNodes);
  const contentHeight = totalRows * ROW_HEIGHT;

  return (
    <div className="commit-list-table">
      <div className="commit-list-header">
        <div className="commit-list-header-graph" style={{ width: graphWidth }} />
        <div className="commit-list-header-message">
          {R.pathOr("Description", ["dag", "colDescription"], t)}
        </div>
        <div className="commit-list-header-author">
          {R.pathOr("Author", ["dag", "colAuthor"], t)}
        </div>
        <div className="commit-list-header-time">
          {R.pathOr("Date", ["dag", "colDate"], t)}
        </div>
        <div className="commit-list-header-oid">
          {R.pathOr("Hash", ["dag", "colHash"], t)}
        </div>
      </div>
      <div className="commit-list-content" style={{ height: contentHeight }}>
        <GraphLanesSvg
          edgeSegments={edgeSegments}
          nodes={dagNodes}
          maxColumn={maxColumn}
          totalRows={totalRows}
        />
        {R.addIndex(R.map)(
          (node, idx) => (
            <CommitRow
              key={R.prop("oid", node)}
              node={node}
              index={idx}
              graphWidth={graphWidth}
            />
          ),
          dagNodes,
        )}
      </div>
    </div>
  );
}
