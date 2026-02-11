import ELK from "elkjs/lib/elk.bundled.js";
import * as R from "ramda";
import { elkLayoutOptions, getElkNodeDimensions } from "./elk";

const elk = new ELK();

const toElkNode = (dagNode) => {
  const { width, height } = getElkNodeDimensions();
  return {
    id: R.prop("oid", dagNode),
    width,
    height,
    layoutOptions: {
      "elk.position": `(${R.prop("column", dagNode) * (width + 40)}, 0)`,
    },
    data: dagNode,
  };
};

const toElkEdge = (dagEdge, index) => ({
  id: `e-${index}`,
  sources: [R.prop("from_oid", dagEdge)],
  targets: [R.prop("to_oid", dagEdge)],
});

const toReactFlowNode = (elkNode) => ({
  id: R.prop("id", elkNode),
  type: "commitNode",
  position: { x: R.propOr(0, "x", elkNode), y: R.propOr(0, "y", elkNode) },
  data: R.prop("data", elkNode),
});

const toReactFlowEdge = (elkEdge) => ({
  id: R.prop("id", elkEdge),
  source: R.head(R.propOr([], "sources", elkEdge)),
  target: R.head(R.propOr([], "targets", elkEdge)),
  type: "smoothstep",
  animated: false,
});

export const computeElkLayout = async (dagNodes, dagEdges) => {
  const elkNodes = R.map(toElkNode, dagNodes);
  const elkEdges = R.addIndex(R.map)(toElkEdge, dagEdges);

  const graph = {
    id: "root",
    layoutOptions: elkLayoutOptions,
    children: elkNodes,
    edges: elkEdges,
  };

  const layoutResult = await elk.layout(graph);

  const nodes = R.map(toReactFlowNode, R.propOr([], "children", layoutResult));
  const edges = R.map(toReactFlowEdge, R.propOr([], "edges", layoutResult));

  return { nodes, edges };
};
