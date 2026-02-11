import { memo } from "react";
import * as R from "ramda";

const ROW_HEIGHT = 32;
const LANE_SPACING = 16;
const DOT_RADIUS = 4;
const GRAPH_PADDING = 12;
const CURVE_OFFSET = 16;

const LANE_COLORS = [
  "#0071e3", "#34c759", "#ff9f0a", "#af52de",
  "#ff3b30", "#5ac8fa", "#ff6482", "#30d158",
];

const laneColor = (col) => LANE_COLORS[col % R.length(LANE_COLORS)];

const colToX = (col) => GRAPH_PADDING + col * LANE_SPACING;
const rowToY = (row) => row * ROW_HEIGHT + ROW_HEIGHT / 2;

const StraightEdge = memo(({ fromRow, toRow, col }) => (
  <line
    x1={colToX(col)}
    y1={rowToY(fromRow)}
    x2={colToX(col)}
    y2={rowToY(toRow)}
    stroke={laneColor(col)}
    strokeWidth={2}
  />
));
StraightEdge.displayName = "StraightEdge";

const CurvedEdge = memo(({ fromRow, fromCol, toRow, toCol }) => {
  const x1 = colToX(fromCol);
  const y1 = rowToY(fromRow);
  const x2 = colToX(toCol);
  const y2 = rowToY(toRow);
  const d = `M ${x1} ${y1} L ${x1} ${y2 - CURVE_OFFSET} Q ${x1} ${y2} ${x2} ${y2}`;

  return (
    <path
      d={d}
      stroke={laneColor(toCol)}
      strokeWidth={2}
      fill="none"
    />
  );
});
CurvedEdge.displayName = "CurvedEdge";

const CommitDot = memo(({ row, col }) => (
  <circle
    cx={colToX(col)}
    cy={rowToY(row)}
    r={DOT_RADIUS}
    fill={laneColor(col)}
    stroke="var(--color-bg-primary)"
    strokeWidth={2}
  />
));
CommitDot.displayName = "CommitDot";

export const GraphLanesSvg = memo(function GraphLanesSvg({ edgeSegments, nodes, maxColumn, totalRows }) {
  const graphWidth = R.max(40, (maxColumn + 1) * LANE_SPACING + GRAPH_PADDING * 2);
  const svgHeight = totalRows * ROW_HEIGHT;

  const isStraight = (seg) => R.equals(R.prop("fromCol", seg), R.prop("toCol", seg));

  const straightEdges = R.filter(isStraight, edgeSegments);
  const curvedEdges = R.reject(isStraight, edgeSegments);

  return (
    <svg
      className="commit-list-graph-svg"
      width={graphWidth}
      height={svgHeight}
      style={{ minWidth: graphWidth }}
    >
      {R.map(
        (seg) => (
          <StraightEdge
            key={`s-${R.prop("fromRow", seg)}-${R.prop("toRow", seg)}-${R.prop("fromCol", seg)}`}
            fromRow={R.prop("fromRow", seg)}
            toRow={R.prop("toRow", seg)}
            col={R.prop("fromCol", seg)}
          />
        ),
        straightEdges,
      )}
      {R.map(
        (seg) => (
          <CurvedEdge
            key={`c-${R.prop("fromRow", seg)}-${R.prop("toRow", seg)}-${R.prop("fromCol", seg)}-${R.prop("toCol", seg)}`}
            fromRow={R.prop("fromRow", seg)}
            fromCol={R.prop("fromCol", seg)}
            toRow={R.prop("toRow", seg)}
            toCol={R.prop("toCol", seg)}
          />
        ),
        curvedEdges,
      )}
      {R.addIndex(R.map)(
        (node, idx) => (
          <CommitDot
            key={R.prop("oid", node)}
            row={idx}
            col={R.prop("column", node)}
          />
        ),
        nodes,
      )}
    </svg>
  );
});
