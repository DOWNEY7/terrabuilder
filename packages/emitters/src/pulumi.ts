import type { TBCanvas, TBNode, TBEdge } from '@terrabuilder/engine';
import { resolveGraph, sanitizeName } from '@terrabuilder/engine';

// ─── Pulumi TypeScript Emitter ────────────────────────────────────────────────
// Generates idiomatic Pulumi TypeScript code from a TBCanvas IR.

function toCamelCase(str: string): string {
  const clean = sanitizeName(str);
  return clean.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function formatPulumiValue(value: unknown): string {
  if (value === undefined || value === null) return 'undefined';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(formatPulumiValue).join(', ')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${toCamelCase(k)}: ${formatPulumiValue(v)}`);
    return `{ ${entries.join(', ')} }`;
  }
  return JSON.stringify(value);
}

function renderPulumiResource(node: TBNode, edges: TBEdge[], nodeMap: Map<string, TBNode>): string {
  const { resourceType, displayName, config, provider } = node.data;
  const varName = toCamelCase(displayName || resourceType);
  const resourceName = sanitizeName(displayName || node.id);

  // Incoming connections to this node
  const incomingEdges = edges.filter(e => e.target === node.id);

  // Copy config properties
  const props: Record<string, string> = {};

  for (const [key, val] of Object.entries(config)) {
    if (val !== undefined && val !== '') {
      props[toCamelCase(key)] = formatPulumiValue(val);
    }
  }

  // Handle incoming connections (references)
  for (const edge of incomingEdges) {
    const sourceNode = nodeMap.get(edge.source);
    if (sourceNode) {
      const sourceVarName = toCamelCase(sourceNode.data.displayName || sourceNode.data.resourceType);
      const rel = edge.data?.relationship || 'id';
      const relCamel = toCamelCase(rel);
      props[relCamel] = `${sourceVarName}.id`;
    }
  }

  const propEntries = Object.entries(props)
    .map(([k, v]) => `  ${k}: ${v},`)
    .join('\n');

  if (provider === 'aws') {
    switch (resourceType) {
      case 'aws_instance':
        return `const ${varName} = new aws.ec2.Instance("${resourceName}", {\n${propEntries}\n});`;
      case 'aws_s3_bucket':
        return `const ${varName} = new aws.s3.BucketV2("${resourceName}", {\n${propEntries}\n});`;
      case 'aws_vpc':
        return `const ${varName} = new aws.ec2.Vpc("${resourceName}", {\n${propEntries}\n});`;
      case 'aws_subnet':
        return `const ${varName} = new aws.ec2.Subnet("${resourceName}", {\n${propEntries}\n});`;
      case 'aws_security_group':
        return `const ${varName} = new aws.ec2.SecurityGroup("${resourceName}", {\n${propEntries}\n});`;
      case 'aws_db_instance':
        return `const ${varName} = new aws.rds.Instance("${resourceName}", {\n${propEntries}\n});`;
      case 'aws_lambda_function':
        return `const ${varName} = new aws.lambda.Function("${resourceName}", {\n${propEntries}\n});`;
      case 'aws_dynamodb_table':
        return `const ${varName} = new aws.dynamodb.Table("${resourceName}", {\n${propEntries}\n});`;
      case 'aws_alb':
        return `const ${varName} = new aws.lb.LoadBalancer("${resourceName}", {\n${propEntries}\n});`;
      case 'aws_iam_role':
        return `const ${varName} = new aws.iam.Role("${resourceName}", {\n${propEntries}\n});`;
      default: {
        const parts = resourceType.replace(/^aws_/, '').split('_');
        const moduleName = parts[0];
        const className = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
        return `const ${varName} = new aws.${moduleName}.${className}("${resourceName}", {\n${propEntries}\n});`;
      }
    }
  } else if (provider === 'azure') {
    const parts = resourceType.replace(/^azurerm_/, '').split('_');
    const className = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    return `const ${varName} = new azureNative.${parts[0]}.${className}("${resourceName}", {\n${propEntries}\n});`;
  } else if (provider === 'gcp') {
    const parts = resourceType.replace(/^google_/, '').split('_');
    const className = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    return `const ${varName} = new gcp.${parts[0]}.${className}("${resourceName}", {\n${propEntries}\n});`;
  }

  return `// Resource ${resourceType} (${varName})\nconst ${varName} = new pulumi.CustomResource("${resourceType}", "${resourceName}", {\n${propEntries}\n});`;
}

export function emitPulumi(canvas: TBCanvas): string {
  if (canvas.nodes.length === 0) {
    return `import * as pulumi from "@pulumi/pulumi";\n\n// No resources configured on canvas.\n`;
  }

  const nodeMap = new Map<string, TBNode>(canvas.nodes.map(n => [n.id, n]));
  const providers = new Set(canvas.nodes.map(n => n.data.provider));

  const imports: string[] = ['import * as pulumi from "@pulumi/pulumi";'];
  if (providers.has('aws')) imports.push('import * as aws from "@pulumi/aws";');
  if (providers.has('azure')) imports.push('import * as azureNative from "@pulumi/azure-native";');
  if (providers.has('gcp')) imports.push('import * as gcp from "@pulumi/gcp";');

  const { order } = resolveGraph(canvas);
  const orderedNodes = order.map(id => nodeMap.get(id)).filter((n): n is TBNode => Boolean(n));

  const resourceBlocks = orderedNodes.map(node => renderPulumiResource(node, canvas.edges, nodeMap));

  const exports = orderedNodes.map(node => {
    const varName = toCamelCase(node.data.displayName || node.data.resourceType);
    return `export const ${varName}Id = ${varName}.id;`;
  });

  return [
    `// Generated by TerraBuilder v0.2.0 — Visual Infrastructure Compiler`,
    `// Target: Pulumi TypeScript`,
    ``,
    imports.join('\n'),
    ``,
    `// ─── Infrastructure Resources ──────────────────────────────────────────────`,
    resourceBlocks.join('\n\n'),
    ``,
    `// ─── Stack Outputs ──────────────────────────────────────────────────────────`,
    exports.join('\n'),
    ``,
  ].join('\n');
}
