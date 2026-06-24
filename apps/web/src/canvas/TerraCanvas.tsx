import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import { useCanvasStore } from '../store/canvas';
import { ResourceNode } from './nodes/ResourceNode';
import { CustomEdge } from './edges/CustomEdge';
import { getSchema } from '@terrabuilder/schemas';
import type { TBNode, TBEdge } from '@terrabuilder/engine';

const nodeTypes = { resource: ResourceNode };
const edgeTypes = { custom: CustomEdge };

export function TerraCanvas() {
  const { screenToFlowPosition } = useReactFlow();
  const {
    nodes, edges,
    onConnect: storeOnConnect,
    selectNode, addNode,
    cloudFilter,
    removeNode,
    onNodesPositionChange,
  } = useCanvasStore();

  // Filter nodes by cloud
  const visibleNodes = cloudFilter === 'all'
    ? nodes
    : nodes.filter((n: TBNode) => n.data.provider === cloudFilter);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: TBNode) => {
    selectNode(node.id);
  }, [selectNode]);

  const handlePaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const resourceType = e.dataTransfer.getData('application/terrabuilder-resource');
    if (!resourceType) return;
    const schema = getSchema(resourceType);
    if (!schema) return;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addNode(schema, position);
  }, [screenToFlowPosition, addNode]);

  const handleNodesChange = useCallback((changes: NodeChange<TBNode>[]) => {
    const current = useCanvasStore.getState().nodes;
    const updated = applyNodeChanges(changes, current) as TBNode[];
    onNodesPositionChange(updated);
  }, [onNodesPositionChange]);

  const handleEdgesChange = useCallback((changes: EdgeChange<TBEdge>[]) => {
    const current = useCanvasStore.getState().edges;
    const updated = applyEdgeChanges(changes, current) as TBEdge[];
    useCanvasStore.setState({ edges: updated });
  }, []);

  const handleConnect = useCallback((connection: Connection) => {
    useCanvasStore.getState().onConnect(connection);
  }, []);

  const isEmpty = nodes.length === 0;

  return (
    <div className="canvas-area" onDragOver={handleDragOver} onDrop={handleDrop}>
      <ReactFlow
        nodes={visibleNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        snapToGrid
        snapGrid={[16, 16]}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'custom', animated: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.04)"
        />
        <Controls />
        <MiniMap
          nodeColor={(n: TBNode) => n.data.color ?? '#1c2030'}
          maskColor="rgba(0,0,0,0.6)"
          style={{ background: 'var(--bg-surface)' }}
        />
      </ReactFlow>

      {isEmpty && (
        <div className="canvas-empty">
          <div className="canvas-empty-icon">⬡</div>
          <div className="canvas-empty-title">EMPTY CANVAS</div>
          <div className="canvas-empty-sub">
            Drag resources from the left panel onto the canvas.<br />
            Connect them by dragging between the handles.<br />
            Watch your Terraform code generate live.
          </div>
        </div>
      )}

      <CanvasScoreBadge />
    </div>
  );
}

function CanvasScoreBadge() {
  const { securityReport, nodes } = useCanvasStore();
  if (nodes.length === 0) return null;

  const score = securityReport.canvasScore;
  const color = score >= 80 ? 'var(--score-good)' : score >= 50 ? 'var(--score-warn)' : 'var(--score-bad)';

  return (
    <div className="canvas-score-badge">
      <div className="canvas-score-number" style={{ color }}>{score}</div>
      <div style={{ color: 'var(--border-hover)', fontSize: 14 }}>/</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>100</div>
      <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 8px' }} />
      <div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Security Score</div>
        {securityReport.deployBlocked && (
          <div className="canvas-score-blocked">⚠ Deploy Blocked</div>
        )}
      </div>
    </div>
  );
}
