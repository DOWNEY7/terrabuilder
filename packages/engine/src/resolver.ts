import type { TBNode, TBEdge, TBCanvas, ResolvedGraph, DependencyEdge } from './graph.js';

// ─── Dependency Resolver ─────────────────────────────────────────────────────
// Builds a topological sort of nodes based on their connections.
// Determines reference expressions for code generation.

/**
 * Relationship map: (sourceType, targetType) → attribute to reference
 * When source connects to target, the target references source via this attribute
 */
const RELATIONSHIP_ATTR_MAP: Record<string, string> = {
  // VPC relationships
  'aws_vpc→aws_subnet': 'id',
  'aws_vpc→aws_security_group': 'id',
  'aws_subnet→aws_instance': 'id',
  'aws_subnet→aws_db_instance': 'id',
  'aws_subnet→aws_lambda_function': 'id',
  'aws_security_group→aws_instance': 'id',
  'aws_security_group→aws_db_instance': 'id',
  'aws_security_group→aws_alb': 'id',
  'aws_security_group→aws_lambda_function': 'id',
  // IAM
  'aws_iam_role→aws_instance': 'name',
  'aws_iam_role→aws_lambda_function': 'arn',
  // ALB relationships
  'aws_alb→aws_route53_record': 'dns_name',
  // CloudFront
  'aws_s3_bucket→aws_cloudfront_distribution': 'bucket_regional_domain_name',
  // Azure
  'azurerm_virtual_network→azurerm_subnet': 'id',
  'azurerm_subnet→azurerm_virtual_machine': 'id',
  'azurerm_subnet→azurerm_sql_database': 'id',
  // GCP
  'google_compute_network→google_compute_subnetwork': 'id',
  'google_compute_subnetwork→google_compute_instance': 'id',
};

/**
 * Default property names when a dependency edge is traversed
 */
const TARGET_PROPERTY_MAP: Record<string, string> = {
  'aws_vpc→aws_subnet': 'vpc_id',
  'aws_vpc→aws_security_group': 'vpc_id',
  'aws_subnet→aws_instance': 'subnet_id',
  'aws_subnet→aws_db_instance': 'db_subnet_group_name',
  'aws_subnet→aws_lambda_function': 'subnet_ids',
  'aws_security_group→aws_instance': 'vpc_security_group_ids',
  'aws_security_group→aws_db_instance': 'vpc_security_group_ids',
  'aws_security_group→aws_alb': 'security_groups',
  'aws_security_group→aws_lambda_function': 'security_group_ids',
  'aws_iam_role→aws_instance': 'iam_instance_profile',
  'aws_iam_role→aws_lambda_function': 'role',
  'azurerm_virtual_network→azurerm_subnet': 'virtual_network_name',
  'azurerm_subnet→azurerm_virtual_machine': 'subnet_id',
  'google_compute_network→google_compute_subnetwork': 'network',
  'google_compute_subnetwork→google_compute_instance': 'subnetwork',
};

export function resolveGraph(canvas: TBCanvas): ResolvedGraph {
  const { nodes, edges } = canvas;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Build adjacency list (dependencies: source must come before target)
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  const dependencyEdges: DependencyEdge[] = [];

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) continue;

    // Source must be created before target
    adjacency.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);

    const mapKey = `${source.data.resourceType}→${target.data.resourceType}`;
    const relationship = edge.data?.relationship ?? TARGET_PROPERTY_MAP[mapKey] ?? 'id';
    const attribute = RELATIONSHIP_ATTR_MAP[mapKey] ?? 'id';

    dependencyEdges.push({
      fromNodeId: edge.source,
      toNodeId: edge.target,
      relationship,
      attribute,
    });
  }

  // Kahn's algorithm for topological sort
  const queue: string[] = [];
  const order: string[] = [];
  const cycles: string[][] = [];

  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  // Detect cycles (any node not in order)
  if (order.length < nodes.length) {
    const remaining = nodes.map(n => n.id).filter(id => !order.includes(id));
    cycles.push(remaining);
    // Still include them in output, just at the end
    order.push(...remaining);
  }

  return { order, dependencies: dependencyEdges, cycles };
}

/**
 * Get the TF reference expression for a dependency
 * e.g. "aws_security_group.web_sg.id"
 */
export function getTFReference(
  node: TBNode,
  attribute: string
): string {
  return `${node.data.resourceType}.${sanitizeName(node.data.displayName)}.${attribute}`;
}

/**
 * Sanitize a name to be a valid Terraform identifier
 */
export function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[0-9]/, '_$&')
    .replace(/__+/g, '_')
    .replace(/^_|_$/g, '') || 'resource';
}

/**
 * Get all dependencies for a given node
 */
export function getNodeDependencies(
  nodeId: string,
  edges: TBEdge[],
  nodes: TBNode[]
): Array<{ node: TBNode; relationship: string; attribute: string }> {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  return edges
    .filter(e => e.target === nodeId)
    .map(edge => {
      const sourceNode = nodeMap.get(edge.source);
      if (!sourceNode) return null;
      const mapKey = `${sourceNode.data.resourceType}→${nodeMap.get(nodeId)?.data.resourceType ?? ''}`;
      return {
        node: sourceNode,
        relationship: edge.data?.relationship ?? TARGET_PROPERTY_MAP[mapKey] ?? 'id',
        attribute: RELATIONSHIP_ATTR_MAP[mapKey] ?? 'id',
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);
}
