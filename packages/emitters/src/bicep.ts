import type { TBCanvas, TBNode } from '@terrabuilder/engine';
import { resolveGraph, sanitizeName } from '@terrabuilder/engine';
import { getSchema } from '@terrabuilder/schemas';

// ─── Azure Bicep Emitter ──────────────────────────────────────────────────────
// Generates Azure Bicep DSL from a TBCanvas IR (Azure resources only).

export function emitBicep(canvas: TBCanvas): string {
  const azureNodes = canvas.nodes.filter(n => n.data.provider === 'azure');
  const nonAzureCount = canvas.nodes.filter(n => n.data.provider !== 'azure').length;

  if (canvas.nodes.length === 0) {
    return `// TerraBuilder — Bicep\n// Add Azure resources to generate Bicep templates.\n`;
  }

  const sections: string[] = [];
  sections.push(
    `// ─────────────────────────────────────────────────────────────────────────────
// TerraBuilder Generated Bicep Template
// Canvas: ${canvas.meta.name}
// Generated: ${new Date().toISOString()}
// ─────────────────────────────────────────────────────────────────────────────
`
  );

  if (nonAzureCount > 0) {
    sections.push(
      `// NOTE: ${nonAzureCount} non-Azure resource(s) omitted.\n// Use Terraform output for multi-cloud deployments.\n`
    );
  }

  if (azureNodes.length === 0) {
    sections.push('// No Azure resources found in this canvas.');
    return sections.join('\n');
  }

  // Parameters
  sections.push("@description('Deployment environment')\n@allowed(['prod', 'staging', 'dev'])\nparam environment string = 'prod'");
  sections.push('');
  sections.push("@description('Azure region for all resources')\nparam location string = resourceGroup().location");
  sections.push('');

  // Variables
  sections.push("var tags = {\n  ManagedBy: 'TerraBuilder'\n  Environment: environment\n}");
  sections.push('');

  const { order } = resolveGraph({ nodes: azureNodes, edges: canvas.edges, meta: canvas.meta });
  const nodeMap = new Map(azureNodes.map(n => [n.id, n]));

  for (const nodeId of order) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;
    const schema = getSchema(node.data.resourceType);
    if (!schema?.bicepType || !schema.bicepApiVersion) continue;

    const resourceName = sanitizeName(node.data.displayName);
    sections.push(`// ${node.data.displayName}`);
    sections.push(`resource ${resourceName} '${schema.bicepType}@${schema.bicepApiVersion}' = {`);
    sections.push(`  name: '${node.data.displayName}'`);
    sections.push("  location: location");

    // Properties
    const props = buildBicepProperties(node);
    if (Object.keys(props).length > 0) {
      sections.push('  properties: {');
      for (const [k, v] of Object.entries(props)) {
        sections.push(`    ${k}: ${formatBicepValue(v)}`);
      }
      sections.push('  }');
    }

    sections.push('  tags: tags');
    sections.push('}');
    sections.push('');
  }

  // Outputs
  sections.push('// ── Outputs ──────────────────────────────────────────────────────────────────');
  for (const nodeId of order) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;
    const schema = getSchema(node.data.resourceType);
    if (!schema?.bicepType) continue;
    const resourceName = sanitizeName(node.data.displayName);
    sections.push(`output ${resourceName}Id string = ${resourceName}.id`);
  }

  return sections.join('\n');
}

function formatBicepValue(value: unknown): string {
  if (typeof value === 'string') return `'${value}'`;
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);
  return JSON.stringify(value);
}

function buildBicepProperties(node: TBNode): Record<string, unknown> {
  const config = node.data.config;
  const props: Record<string, unknown> = {};

  // Map TF property names to Bicep/ARM property names
  const bicepMappings: Record<string, string> = {
    size: 'hardwareProfile.vmSize',
    admin_username: 'osProfile.adminUsername',
    account_tier: 'sku.tier',
    account_replication_type: 'sku.name',
    min_tls_version: 'minimumTlsVersion',
    allow_nested_items_to_be_public: 'allowBlobPublicAccess',
    https_only: 'httpsOnly',
    sku_name: 'sku.name',
    soft_delete_retention_days: 'softDeleteRetentionInDays',
    purge_protection_enabled: 'enablePurgeProtection',
  };

  for (const [tfKey, bicepKey] of Object.entries(bicepMappings)) {
    if (config[tfKey] !== undefined) {
      props[bicepKey] = config[tfKey];
    }
  }

  return props;
}
