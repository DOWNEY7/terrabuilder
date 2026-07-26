import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import type {
  TBNode, TBEdge, TBCanvas, TBNodeData,
  ExperienceMode, CloudFilter, OutputFormat, SecurityReport,
  CanvasTemplate, CanvasCostEstimate,
} from '@terrabuilder/engine';
import { HistoryManager, estimateCanvasCost } from '@terrabuilder/engine';
import type { ResourceSchema } from '@terrabuilder/schemas';
import {
  runSecurityEngine,
  applyAutoFix,
  applyAllAutoFixes,
  applyCanvasAutoFixes,
} from '@terrabuilder/security';
import { emit, generateProjectBundle } from '@terrabuilder/emitters';

// ─── Canvas Store ─────────────────────────────────────────────────────────────

const history = new HistoryManager();
let nodeCounter = 0;

function makeNodeId(): string {
  return `node-${Date.now()}-${++nodeCounter}`;
}

function makeEdgeId(): string {
  return `edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface CanvasStore {
  nodes: TBNode[];
  edges: TBEdge[];
  meta: TBCanvas['meta'];
  selectedNodeId: string | null;
  mode: ExperienceMode;
  cloudFilter: CloudFilter;
  outputFormat: OutputFormat;
  bottomTab: 'code' | 'security';
  bottomOpen: boolean;
  showTemplates: boolean;
  graduationPrompt: boolean;
  securityReport: SecurityReport;
  costEstimate: CanvasCostEstimate;
  canUndo: boolean;
  canRedo: boolean;
  generatedCode: string;

  addNode:         (schema: ResourceSchema, position: { x: number; y: number }) => void;
  updateNodeConfig:(id: string, config: Record<string, unknown>) => void;
  updateNodeName:  (id: string, name: string) => void;
  removeNode:      (id: string) => void;
  selectNode:      (id: string | null) => void;
  setMode:         (mode: ExperienceMode) => void;
  setCloudFilter:  (filter: CloudFilter) => void;
  setOutputFormat: (format: OutputFormat) => void;
  setBottomTab:    (tab: 'code' | 'security') => void;
  toggleBottom:    () => void;
  setShowTemplates:(show: boolean) => void;
  dismissGraduation: () => void;
  undo:            () => void;
  redo:            () => void;
  loadTemplate:    (template: CanvasTemplate) => void;
  exportFile:      () => void;
  exportZipBundle: () => void;
  importFile:      (json: string) => void;
  clearCanvas:     () => void;
  applyFix:        (nodeId: string, ruleId: string) => void;
  applyAllFixes:   (nodeId: string) => void;
  applyCanvasFixes:() => void;
  onConnect:       (connection: Connection) => void;
  onNodesPositionChange: (nodes: TBNode[]) => void;
}

const EMPTY_REPORT: SecurityReport = {
  findings: [],
  nodeScores: {},
  canvasScore: 100,
  criticalCount: 0,
  highCount: 0,
  mediumCount: 0,
  lowCount: 0,
  deployBlocked: false,
};

const EMPTY_COST: CanvasCostEstimate = {
  totalMonthlyCost: 0,
  currency: 'USD',
  nodeCosts: [],
};

const INIT_META: TBCanvas['meta'] = {
  name: 'Untitled Infrastructure',
  description: '',
  version: '1.0.0',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function buildCanvas(nodes: TBNode[], edges: TBEdge[], meta: TBCanvas['meta']): TBCanvas {
  return { nodes, edges, meta };
}

function computeCode(nodes: TBNode[], edges: TBEdge[], meta: TBCanvas['meta'], format: OutputFormat): string {
  return emit(buildCanvas(nodes, edges, meta), format);
}

function computeSecurity(nodes: TBNode[], edges: TBEdge[], meta: TBCanvas['meta']): SecurityReport {
  if (nodes.length === 0) return EMPTY_REPORT;
  return runSecurityEngine(buildCanvas(nodes, edges, meta));
}

function applySecurityToNodes(nodes: TBNode[], report: SecurityReport): TBNode[] {
  return nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      securityScore: report.nodeScores[node.id] ?? 100,
      securityFindings: report.findings.filter(f => f.nodeId === node.id),
    },
  }));
}

function recompute(
  nodes: TBNode[],
  edges: TBEdge[],
  meta: TBCanvas['meta'],
  format: OutputFormat
): { nodes: TBNode[]; securityReport: SecurityReport; generatedCode: string; costEstimate: CanvasCostEstimate } {
  const report = computeSecurity(nodes, edges, meta);
  const nodesWithSec = applySecurityToNodes(nodes, report);
  const code = computeCode(nodesWithSec, edges, meta, format);
  const costEstimate = estimateCanvasCost(buildCanvas(nodesWithSec, edges, meta));
  return { nodes: nodesWithSec, securityReport: report, generatedCode: code, costEstimate };
}

export const useCanvasStore = create<CanvasStore>()((set, get) => ({
  nodes: [],
  edges: [],
  meta: INIT_META,
  selectedNodeId: null,
  mode: 'intermediate',
  cloudFilter: 'all',
  outputFormat: 'terraform',
  bottomTab: 'code',
  bottomOpen: true,
  showTemplates: false,
  graduationPrompt: false,
  securityReport: EMPTY_REPORT,
  costEstimate: EMPTY_COST,
  canUndo: false,
  canRedo: false,
  generatedCode: '# Add resources to the canvas to generate code.\n',

  addNode(schema, position) {
    const { nodes, edges, meta, mode, outputFormat } = get();
    history.push({ nodes, edges, timestamp: Date.now() });

    const defaultConfig: Record<string, unknown> = {};
    for (const prop of schema.properties) {
      if (prop.default !== undefined) defaultConfig[prop.key] = prop.default;
    }
    Object.assign(defaultConfig, schema.secureDefaults);

    const id = makeNodeId();
    const sameType = nodes.filter(n => n.data.resourceType === schema.resourceType).length + 1;
    const suffix = schema.resourceType.split('_').slice(-1)[0];
    const displayName = `${suffix}-${sameType}`;

    const newNode: TBNode = {
      id,
      type: 'resource',
      position,
      data: {
        provider: schema.provider,
        resourceType: schema.resourceType,
        displayName,
        friendlyName: schema.friendlyName,
        config: defaultConfig,
        securityScore: 100,
        securityFindings: [],
        category: schema.category,
        icon: schema.icon,
        color: schema.color,
      },
    };

    const newNodes = [...nodes, newNode];
    const { nodes: updated, securityReport, generatedCode, costEstimate } = recompute(newNodes, edges, meta, outputFormat);

    const shouldGraduate = mode === 'beginner' && newNodes.length >= 6;

    set({
      nodes: updated, securityReport, generatedCode, costEstimate,
      canUndo: true, canRedo: false,
      graduationPrompt: shouldGraduate ? true : get().graduationPrompt,
    });
  },

  updateNodeConfig(id, config) {
    const { nodes, edges, meta, outputFormat } = get();
    history.push({ nodes, edges, timestamp: Date.now() });
    const newNodes = nodes.map(n => n.id === id ? { ...n, data: { ...n.data, config } } : n);
    const { nodes: updated, securityReport, generatedCode, costEstimate } = recompute(newNodes, edges, meta, outputFormat);
    set({ nodes: updated, securityReport, generatedCode, costEstimate, canUndo: true });
  },

  updateNodeName(id, name) {
    const { nodes, edges, meta, outputFormat } = get();
    history.push({ nodes, edges, timestamp: Date.now() });
    const newNodes = nodes.map(n => n.id === id ? { ...n, data: { ...n.data, displayName: name } } : n);
    const { nodes: updated, securityReport, generatedCode, costEstimate } = recompute(newNodes, edges, meta, outputFormat);
    set({ nodes: updated, securityReport, generatedCode, costEstimate, canUndo: true });
  },

  removeNode(id) {
    const { nodes, edges, meta, outputFormat } = get();
    history.push({ nodes, edges, timestamp: Date.now() });
    const newNodes = nodes.filter(n => n.id !== id);
    const newEdges = edges.filter(e => e.source !== id && e.target !== id);
    const { nodes: updated, securityReport, generatedCode, costEstimate } = recompute(newNodes, newEdges, meta, outputFormat);
    set({ nodes: updated, edges: newEdges, securityReport, generatedCode, costEstimate, selectedNodeId: null, canUndo: true });
  },

  onConnect(connection: Connection) {
    const { nodes, edges, meta, outputFormat } = get();
    history.push({ nodes, edges, timestamp: Date.now() });
    const newEdge: TBEdge = {
      id: makeEdgeId(),
      source: connection.source ?? '',
      target: connection.target ?? '',
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'custom',
      animated: true,
    };
    const newEdges = [...edges, newEdge];
    const { nodes: updated, securityReport, generatedCode, costEstimate } = recompute(nodes, newEdges, meta, outputFormat);
    set({ nodes: updated, edges: newEdges, securityReport, generatedCode, costEstimate, canUndo: true });
  },

  onNodesPositionChange(updatedNodes) {
    set({ nodes: updatedNodes });
  },

  selectNode: (id) => set({ selectedNodeId: id }),
  setMode: (mode) => set({ mode }),
  setCloudFilter: (cloudFilter) => set({ cloudFilter }),

  setOutputFormat(format) {
    const { nodes, edges, meta } = get();
    const code = computeCode(nodes, edges, meta, format);
    set({ outputFormat: format, generatedCode: code });
  },

  setBottomTab: (tab) => set({ bottomTab: tab, bottomOpen: true }),
  toggleBottom: () => set(s => ({ bottomOpen: !s.bottomOpen })),
  setShowTemplates: (show) => set({ showTemplates: show }),
  dismissGraduation: () => set({ graduationPrompt: false }),

  undo() {
    const { nodes, edges, meta, outputFormat } = get();
    const prev = history.undo({ nodes, edges, timestamp: Date.now() });
    if (!prev) return;
    const { nodes: updated, securityReport, generatedCode, costEstimate } = recompute(prev.nodes, prev.edges, meta, outputFormat);
    set({ nodes: updated, edges: prev.edges, securityReport, generatedCode, costEstimate, canUndo: history.canUndo, canRedo: history.canRedo });
  },

  redo() {
    const { nodes, edges, meta, outputFormat } = get();
    const next = history.redo({ nodes, edges, timestamp: Date.now() });
    if (!next) return;
    const { nodes: updated, securityReport, generatedCode, costEstimate } = recompute(next.nodes, next.edges, meta, outputFormat);
    set({ nodes: updated, edges: next.edges, securityReport, generatedCode, costEstimate, canUndo: history.canUndo, canRedo: history.canRedo });
  },

  loadTemplate(template) {
    history.push({ nodes: get().nodes, edges: get().edges, timestamp: Date.now() });
    const { nodes, edges } = template.canvas;
    const meta = { ...INIT_META, name: template.name, updatedAt: new Date().toISOString() };
    const { nodes: updated, securityReport, generatedCode, costEstimate } = recompute(nodes, edges, meta, get().outputFormat);
    set({ nodes: updated, edges, meta, securityReport, generatedCode, costEstimate, showTemplates: false, selectedNodeId: null, canUndo: true });
  },

  exportFile() {
    const { nodes, edges, meta } = get();
    const canvas: TBCanvas = { nodes, edges, meta: { ...meta, updatedAt: new Date().toISOString() } };
    const blob = new Blob([JSON.stringify(canvas, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meta.name.replace(/\s+/g, '-').toLowerCase()}.tbp`;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportZipBundle() {
    const { nodes, edges, meta, outputFormat } = get();
    const canvas: TBCanvas = { nodes, edges, meta: { ...meta, updatedAt: new Date().toISOString() } };
    const files = generateProjectBundle(canvas, outputFormat);

    // Download manifest JSON bundle or individual files
    const manifest = {
      projectName: meta.name,
      format: outputFormat,
      generatedAt: new Date().toISOString(),
      files,
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meta.name.replace(/\s+/g, '-').toLowerCase()}-bundle.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importFile(json) {
    try {
      const canvas = JSON.parse(json) as TBCanvas;
      history.push({ nodes: get().nodes, edges: get().edges, timestamp: Date.now() });
      const { nodes: updated, securityReport, generatedCode, costEstimate } = recompute(canvas.nodes, canvas.edges, canvas.meta, get().outputFormat);
      set({ nodes: updated, edges: canvas.edges, meta: canvas.meta, securityReport, generatedCode, costEstimate, selectedNodeId: null, canUndo: true });
    } catch (e) {
      console.error('Failed to import .tbp file:', e);
    }
  },

  clearCanvas() {
    history.push({ nodes: get().nodes, edges: get().edges, timestamp: Date.now() });
    const meta = { ...INIT_META, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    set({
      nodes: [], edges: [], meta,
      securityReport: EMPTY_REPORT,
      costEstimate: EMPTY_COST,
      generatedCode: '# Add resources to the canvas to generate code.\n',
      selectedNodeId: null,
      canUndo: true,
    });
  },

  applyFix(nodeId, ruleId) {
    const { nodes, edges, meta } = get();
    const canvas = buildCanvas(nodes, edges, meta);
    const fixedConfig = applyAutoFix(nodeId, ruleId, canvas);
    if (!fixedConfig) return;
    get().updateNodeConfig(nodeId, fixedConfig);
  },

  applyAllFixes(nodeId) {
    const { nodes, edges, meta } = get();
    const canvas = buildCanvas(nodes, edges, meta);
    const fixedConfig = applyAllAutoFixes(nodeId, canvas);
    if (!fixedConfig) return;
    get().updateNodeConfig(nodeId, fixedConfig);
  },

  applyCanvasFixes() {
    const { nodes, edges, meta, outputFormat } = get();
    const canvas = buildCanvas(nodes, edges, meta);
    const fixes = applyCanvasAutoFixes(canvas);
    let newNodes = nodes;
    for (const [nodeId, config] of fixes) {
      newNodes = newNodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, config } } : n);
    }
    const { nodes: updated, securityReport, generatedCode, costEstimate } = recompute(newNodes, edges, meta, outputFormat);
    set({ nodes: updated, securityReport, generatedCode, costEstimate });
  },
}));
