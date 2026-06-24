import type { TBCanvas, TBNode, TBEdge } from '@terrabuilder/engine';
import { resolveGraph, sanitizeName, getNodeDependencies } from '@terrabuilder/engine';

// ─── Terraform HCL Emitter ───────────────────────────────────────────────────
// Generates valid Terraform HCL from a TBCanvas IR.

const PROVIDER_BLOCKS: Record<string, string> = {
  aws: `terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.6.0"
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}
`,
  azure: `terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  required_version = ">= 1.6.0"
}

provider "azurerm" {
  features {}
}
`,
  gcp: `terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.6.0"
}

provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

variable "gcp_project" {
  description = "GCP project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region for all resources"
  type        = string
  default     = "us-central1"
}
`,
};

export function emitTerraform(canvas: TBCanvas): string {
  if (canvas.nodes.length === 0) {
    return `# TerraBuilder — Empty Canvas
# Add resources to the canvas to generate Terraform code.
`;
  }

  const { order } = resolveGraph(canvas);
  const nodeMap = new Map(canvas.nodes.map(n => [n.id, n]));

  // Determine which providers are used
  const providers = new Set(canvas.nodes.map(n => n.data.provider));

  const sections: string[] = [];

  // Header comment
  sections.push(
    `# ──────────────────────────────────────────────────────────────────────────
# TerraBuilder Generated Configuration
# Canvas: ${canvas.meta.name}
# Generated: ${new Date().toISOString()}
# Resources: ${canvas.nodes.length} | Connections: ${canvas.edges.length}
# ──────────────────────────────────────────────────────────────────────────
`
  );

  // Provider blocks
  for (const provider of providers) {
    sections.push(PROVIDER_BLOCKS[provider] ?? '');
  }

  // Sensitive variable declarations
  const sensitiveNodes = canvas.nodes.filter(n =>
    Object.values(n.data.config).some(v => typeof v === 'string' && v.includes('SENSITIVE'))
  );
  if (sensitiveNodes.length > 0) {
    sections.push(`# ── Sensitive Variables ──────────────────────────────────────────────────`);
    for (const node of sensitiveNodes) {
      const name = sanitizeName(node.data.displayName);
      sections.push(
        `variable "${name}_password" {\n  description = "Password for ${node.data.displayName}"\n  type        = string\n  sensitive   = true\n}\n`
      );
    }
  }

  sections.push(`# ── Resources ────────────────────────────────────────────────────────────\n`);

  // Resource blocks in topological order
  for (const nodeId of order) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;
    sections.push(emitResourceBlock(node, canvas.edges, canvas.nodes));
  }

  return sections.join('\n');
}

function emitResourceBlock(node: TBNode, edges: TBEdge[], allNodes: TBNode[]): string {
  const { resourceType, displayName, config } = node.data;
  const name = sanitizeName(displayName);
  const deps = getNodeDependencies(node.id, edges, allNodes);

  const lines: string[] = [];
  lines.push(`resource "${resourceType}" "${name}" {`);

  // Emit dependencies as references first
  for (const dep of deps) {
    const depName = sanitizeName(dep.node.data.displayName);
    const refExpr = `${dep.node.data.resourceType}.${depName}.${dep.attribute}`;
    // Check if it's a list property (security groups etc)
    if (dep.relationship.endsWith('_ids') || dep.relationship.endsWith('_groups')) {
      lines.push(`  ${dep.relationship} = [${refExpr}]`);
    } else {
      lines.push(`  ${dep.relationship} = ${refExpr}`);
    }
  }

  // Emit config properties
  const emittedKeys = new Set(deps.map(d => d.relationship));
  for (const [key, value] of Object.entries(config)) {
    if (emittedKeys.has(key)) continue;
    if (value === null || value === undefined || value === '') continue;

    const hcl = configValueToHCL(key, value, 1);
    if (hcl) lines.push(hcl);
  }

  // Add tags block for AWS resources
  if (node.data.provider === 'aws') {
    lines.push('');
    lines.push('  tags = {');
    lines.push(`    Name        = "${displayName}"`);
    lines.push(`    ManagedBy   = "TerraBuilder"`);
    lines.push('  }');
  }

  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function configValueToHCL(key: string, value: unknown, indent: number): string {
  const pad = '  '.repeat(indent);

  // Skip internal TerraBuilder meta keys
  if (key.startsWith('_')) return '';

  // Handle special nested config patterns (e.g. "root_block_device_encrypted" → nested block)
  if (key === 'root_block_device_encrypted' && value === true) {
    return `${pad}root_block_device {\n${pad}  encrypted = true\n${pad}}`;
  }
  if (key === 'versioning_enabled' && value === true) {
    return `${pad}versioning {\n${pad}  enabled = true\n${pad}}`;
  }
  if (key === 'server_side_encryption_enabled' || key === 'point_in_time_recovery_enabled') {
    const blockName = key === 'server_side_encryption_enabled'
      ? 'server_side_encryption'
      : 'point_in_time_recovery';
    return `${pad}${blockName} {\n${pad}  enabled = ${value}\n${pad}}`;
  }
  if (key === 'sse_algorithm') {
    return `${pad}server_side_encryption_configuration {\n${pad}  rule {\n${pad}    apply_server_side_encryption_by_default {\n${pad}      sse_algorithm = "${value}"\n${pad}    }\n${pad}  }\n${pad}}`;
  }
  if (key.startsWith('block_') || key === 'ignore_public_acls' || key === 'restrict_public_buckets') {
    return ''; // handled separately as aws_s3_bucket_public_access_block
  }

  // Password fields use variable references
  if (key === 'password') {
    return `${pad}password = var.${key}_value`;
  }

  // Normal scalar values
  if (typeof value === 'string') {
    if (value.startsWith('<<RAW>>')) {
      return `${pad}${key} = ${value.slice(7)}`;
    }
    return `${pad}${key} = "${value}"`;
  }
  if (typeof value === 'number') {
    return `${pad}${key} = ${value}`;
  }
  if (typeof value === 'boolean') {
    return `${pad}${key} = ${value}`;
  }
  if (Array.isArray(value)) {
    const items = value.map(v => typeof v === 'string' ? `"${v}"` : String(v));
    return `${pad}${key} = [${items.join(', ')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    const objLines = [`${pad}${key} {`];
    for (const [k, v] of Object.entries(value)) {
      objLines.push(configValueToHCL(k, v, indent + 1));
    }
    objLines.push(`${pad}}`);
    return objLines.filter(Boolean).join('\n');
  }
  return '';
}
