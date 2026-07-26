// ─── TerraBuilder Core IR Types ─────────────────────────────────────────────
// The Internal Representation (IR) for the canvas.
// Every resource on the canvas is a TBNode. Connections are TBEdges.
// The canvas state is a TBCanvas.

export type Provider = 'aws' | 'azure' | 'gcp';
export type OutputFormat = 'terraform' | 'cloudformation' | 'bicep' | 'pulumi';
export type ExperienceMode = 'beginner' | 'intermediate' | 'advanced';
export type CloudFilter = 'all' | Provider;
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// ─── Security Finding ─────────────────────────────────────────────────────────
export interface SecurityFinding {
  ruleId: string;
  nodeId: string;
  severity: Severity;
  message: string;
  autoFixAvailable: boolean;
  autoFixDescription?: string;
}

// ─── Security Report ─────────────────────────────────────────────────────────
export interface SecurityReport {
  findings: SecurityFinding[];
  nodeScores: Record<string, number>;   // nodeId → score 0-100
  canvasScore: number;                  // 0-100 overall
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  deployBlocked: boolean;              // true if canvasScore < 60
}

// ─── Node Data ────────────────────────────────────────────────────────────────
// Compatible with React Flow's Node<T> data shape
export interface TBNodeData {
  provider: Provider;
  resourceType: string;          // terraform resource type e.g. "aws_instance"
  displayName: string;           // user-defined name, used as TF resource name
  friendlyName: string;          // plain-English name for beginner mode
  config: Record<string, unknown>; // resource properties
  securityScore: number;         // 0-100
  securityFindings: SecurityFinding[];
  category: string;
  icon: string;
  color: string;                 // provider accent color
}

// ─── TBNode ────────────────────────────────────────────────────────────────
// Extends React Flow's Node type
export interface TBNode {
  id: string;
  type: 'resource';
  position: { x: number; y: number };
  data: TBNodeData;
  selected?: boolean;
  dragging?: boolean;
}

// ─── TBEdge ────────────────────────────────────────────────────────────────
// Extends React Flow's Edge type
export interface TBEdge {
  id: string;
  source: string;               // source node id
  target: string;               // target node id
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type: 'custom';
  data?: {
    relationship: string;       // e.g. "vpc_id", "subnet_id", "security_group_ids"
    label?: string;
  };
  animated?: boolean;
}

// ─── Canvas Meta ─────────────────────────────────────────────────────────────
export interface CanvasMeta {
  name: string;
  description: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

// ─── TBCanvas ─────────────────────────────────────────────────────────────────
// Full canvas state — this is what gets saved to .tbp files
export interface TBCanvas {
  nodes: TBNode[];
  edges: TBEdge[];
  meta: CanvasMeta;
}

// ─── Canvas Template ─────────────────────────────────────────────────────────
export interface CanvasTemplate {
  id?: string;
  name: string;
  description?: string;
  provider?: Provider | 'multi';
  category?: string;
  difficulty?: ExperienceMode;
  canvas: TBCanvas;
  thumbnail?: string;
}

// ─── Validation Error ────────────────────────────────────────────────────────
export interface ValidationError {
  nodeId: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// ─── Dependency Edge ─────────────────────────────────────────────────────────
// Used by the resolver to represent a dependency between nodes
export interface DependencyEdge {
  fromNodeId: string;            // dependency (must be created first)
  toNodeId: string;              // dependent
  relationship: string;          // property name in the dependent
  attribute: string;             // attribute of the dependency (usually "id")
}

// ─── Topological Sort Result ─────────────────────────────────────────────────
export interface ResolvedGraph {
  order: string[];               // node IDs in topological order
  dependencies: DependencyEdge[];
  cycles: string[][];            // any detected cycles
}
