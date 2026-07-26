import type { TBNode, TBCanvas } from './graph.js';

export interface NodeCost {
  nodeId: string;
  resourceType: string;
  displayName: string;
  monthlyCost: number;
  breakdown: string;
}

export interface CanvasCostEstimate {
  totalMonthlyCost: number;
  currency: string;
  nodeCosts: NodeCost[];
}

const INSTANCE_PRICING: Record<string, number> = {
  // AWS EC2
  't3.nano': 3.80,
  't3.micro': 7.50,
  't3.small': 15.00,
  't3.medium': 30.00,
  't3.large': 60.00,
  't3.xlarge': 120.00,
  'c5.large': 62.00,
  'm5.large': 70.00,
  'r5.large': 90.00,

  // Azure VM
  'Standard_B1ls': 3.80,
  'Standard_B1s': 7.50,
  'Standard_B2s': 30.00,
  'Standard_D2s_v3': 70.00,

  // GCP Compute Engine
  'e2-micro': 7.00,
  'e2-small': 14.00,
  'e2-medium': 25.00,
  'n1-standard-1': 38.00,
};

const RDS_PRICING: Record<string, number> = {
  'db.t3.micro': 15.00,
  'db.t3.small': 30.00,
  'db.t3.medium': 60.00,
  'db.r5.large': 180.00,
};

export function estimateNodeCost(node: TBNode): NodeCost {
  const { resourceType, displayName, config } = node.data;
  let monthlyCost = 5.00;
  let breakdown = 'Standard baseline estimate';

  if (resourceType === 'aws_instance' || resourceType === 'azurerm_linux_virtual_machine' || resourceType === 'google_compute_instance') {
    const instanceType = String(config.instance_type || config.size || config.machine_type || 't3.micro');
    const basePrice = INSTANCE_PRICING[instanceType] ?? 15.00;
    monthlyCost = basePrice;
    breakdown = `${instanceType} instance compute time`;
  } else if (resourceType === 'aws_db_instance' || resourceType === 'azurerm_mssql_database' || resourceType === 'google_sql_database_instance') {
    const dbClass = String(config.instance_class || config.sku_name || 'db.t3.micro');
    const allocatedStorage = Number(config.allocated_storage || 20);
    const basePrice = RDS_PRICING[dbClass] ?? 30.00;
    const storagePrice = allocatedStorage * 0.115;
    monthlyCost = Math.round((basePrice + storagePrice) * 100) / 100;
    breakdown = `${dbClass} ($${basePrice}/mo) + ${allocatedStorage}GB storage ($${storagePrice.toFixed(2)}/mo)`;
  } else if (resourceType === 'aws_s3_bucket' || resourceType === 'azurerm_storage_account' || resourceType === 'google_storage_bucket') {
    monthlyCost = 2.50;
    breakdown = 'Bucket baseline storage & API requests';
  } else if (resourceType === 'aws_lambda_function' || resourceType === 'azurerm_function_app' || resourceType === 'google_cloudfunctions_function') {
    monthlyCost = 1.50;
    breakdown = 'Serverless compute & execution triggers';
  } else if (resourceType === 'aws_dynamodb_table') {
    monthlyCost = 5.00;
    breakdown = 'On-demand read/write throughput baseline';
  } else if (resourceType === 'aws_sqs_queue') {
    monthlyCost = 0.50;
    breakdown = 'Queue storage & message requests';
  } else if (resourceType === 'aws_cloudfront_distribution') {
    monthlyCost = 10.00;
    breakdown = 'CDN edge distribution & data transfer out';
  } else if (resourceType === 'aws_vpc' || resourceType === 'azurerm_virtual_network' || resourceType === 'google_compute_network') {
    monthlyCost = 0.00;
    breakdown = 'Virtual Private Cloud (free resource)';
  } else if (resourceType === 'aws_subnet' || resourceType === 'azurerm_subnet' || resourceType === 'google_compute_subnetwork') {
    monthlyCost = 0.00;
    breakdown = 'Subnet allocation (free resource)';
  } else if (resourceType === 'aws_security_group' || resourceType === 'azurerm_network_security_group') {
    monthlyCost = 0.00;
    breakdown = 'Security group firewall rules (free resource)';
  }

  return {
    nodeId: node.id,
    resourceType,
    displayName: displayName || resourceType,
    monthlyCost,
    breakdown,
  };
}

export function estimateCanvasCost(canvas: TBCanvas): CanvasCostEstimate {
  const nodeCosts = canvas.nodes.map(estimateNodeCost);
  const totalMonthlyCost = Math.round(nodeCosts.reduce((sum, n) => sum + n.monthlyCost, 0) * 100) / 100;

  return {
    totalMonthlyCost,
    currency: 'USD',
    nodeCosts,
  };
}
