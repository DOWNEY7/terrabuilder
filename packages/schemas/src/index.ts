// packages/schemas — public API
export * from './types.js';
export { awsSchemas } from './aws/index.js';
export { azureSchemas } from './azure/index.js';
export { gcpSchemas } from './gcp/index.js';

import { awsSchemas } from './aws/index.js';
import { azureSchemas } from './azure/index.js';
import { gcpSchemas } from './gcp/index.js';
import type { ResourceSchema } from './types.js';
import type { Provider } from '@terrabuilder/engine';

// All schemas indexed by resource type
export const ALL_SCHEMAS: ResourceSchema[] = [
  ...awsSchemas,
  ...azureSchemas,
  ...gcpSchemas,
];

export const SCHEMA_MAP: Record<string, ResourceSchema> = Object.fromEntries(
  ALL_SCHEMAS.map(s => [s.resourceType, s])
);

export function getSchema(resourceType: string): ResourceSchema | undefined {
  return SCHEMA_MAP[resourceType];
}

export function getSchemasByProvider(provider: Provider): ResourceSchema[] {
  return ALL_SCHEMAS.filter(s => s.provider === provider);
}

export function getSchemasByCategory(category: string): ResourceSchema[] {
  return ALL_SCHEMAS.filter(s => s.category === category);
}

export function getBeginnerSchemas(): ResourceSchema[] {
  return ALL_SCHEMAS.filter(s => s.showInBeginner);
}

export function getIntermediateSchemas(): ResourceSchema[] {
  return ALL_SCHEMAS.filter(s => s.showInIntermediate);
}

export function searchSchemas(query: string): ResourceSchema[] {
  const q = query.toLowerCase();
  return ALL_SCHEMAS.filter(s =>
    s.displayName.toLowerCase().includes(q) ||
    s.friendlyName.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.resourceType.toLowerCase().includes(q) ||
    s.tags.some(t => t.includes(q))
  );
}
