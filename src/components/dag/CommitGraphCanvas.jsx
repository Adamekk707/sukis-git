import { useEffect, useMemo, useCallback } from "react";
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState, useReactFlow } from "@xyflow/react";
import { useSetAtom } from "jotai";
import * as R from "ramda";
import { selectedCommitOidAtom } from "../../atoms/uiAtoms";
import { computeElkLayout } from "../../lib/elkLayout";
import CommitNode from "./CommitNode";

const nodeTypes = { commitNode: CommitNode };

function GraphInner({ dagNodes, dagEdges }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const setSelectedOid = useSetAtom(selectedCommitOidAtom);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const shouldSkip = R.or(R.isEmpty(dagNodes), R.isNil(dagNodes));
    if (shouldSkip) {
      setNodes([]);
      setEdges([]);
      return;
    }

    let cancelled = false;
    computeElkLayout(dagNodes, dagEdges).then((layout) => {
      if (cancelled) return;
      setNodes(R.prop("nodes", layout));
      setEdges(R.prop("edges", layout));
      requestAnimationFrame(() => fitView({ padding: 0.2 }));
    });

    return () => { cancelled = true; };
  }, [dagNodes, dagEdges, setNodes, setEdges, fitView]);

  const handleNodeClick = useCallback(
    (_event, node) => setSelectedOid(R.prop("id", node)),
    [setSelectedOid],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      fitView
      minZoom={0.1}
      maxZoom={2}
    />
  );
}

export function CommitGraphCanvas({ dagNodes, dagEdges }) {
  return (
    <ReactFlowProvider>
      <GraphInner dagNodes={dagNodes} dagEdges={dagEdges} />
    </ReactFlowProvider>
  );
}
