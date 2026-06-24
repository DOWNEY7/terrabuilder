import { describe, it, expect } from 'vitest';
import {
  ALL_SCHEMAS,
  SCHEMA_MAP,
  getSchema,
  getSchemasByProvider,
  getBeginnerSchemas,
  getIntermediateSchemas,
  searchSchemas,
} from '../index.js';

// ─── Schema Integrity ─────────────────────────────────────────────────────────

describe('ALL_SCHEMAS — structural integrity', () => {
  it('has at least 50 schemas', () => {
    expect(ALL_SCHEMAS.length).toBeGreaterThanOrEqual(50);
  });

  it('every schema has required string fields', () => {
    for (const schema of ALL_SCHEMAS) {
      expect(schema.resourceType, `${schema.resourceType} missing resourceType`).toBeTruthy();
      expect(schema.displayName, `${schema.resourceType} missing displayName`).toBeTruthy();
      expect(schema.friendlyName, `${schema.resourceType} missing friendlyName`).toBeTruthy();
      expect(schema.description, `${schema.resourceType} missing description`).toBeTruthy();
      expect(schema.icon, `${schema.resourceType} missing icon`).toBeTruthy();
      expect(schema.color, `${schema.resourceType} missing color`).toBeTruthy();
      expect(schema.category, `${schema.resourceType} missing category`).toBeTruthy();
    }
  });

  it('every schema has a valid provider', () => {
    const validProviders = new Set(['aws', 'azure', 'gcp']);
    for (const schema of ALL_SCHEMAS) {
      expect(validProviders.has(schema.provider), `${schema.resourceType} has invalid provider: ${schema.provider}`).toBe(true);
    }
  });

  it('no duplicate resourceType values across all schemas', () => {
    const types = ALL_SCHEMAS.map(s => s.resourceType);
    const duplicates = types.filter((t, i) => types.indexOf(t) !== i);
    expect(duplicates, `Duplicate resourceTypes: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  it('every schema has at least 1 property', () => {
    for (const schema of ALL_SCHEMAS) {
      expect(schema.properties.length, `${schema.resourceType} has no properties`).toBeGreaterThan(0);
    }
  });

  it('all select properties have at least 1 option', () => {
    for (const schema of ALL_SCHEMAS) {
      for (const prop of schema.properties) {
        if (prop.type === 'select') {
          expect(
            prop.options?.length,
            `${schema.resourceType}.${prop.key} is a select with no options`
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it('all property keys are non-empty strings', () => {
    for (const schema of ALL_SCHEMAS) {
      for (const prop of schema.properties) {
        expect(prop.key, `${schema.resourceType} has a property with empty key`).toBeTruthy();
        expect(typeof prop.key).toBe('string');
      }
    }
  });

  it('showInBeginner and showInIntermediate are booleans', () => {
    for (const schema of ALL_SCHEMAS) {
      expect(typeof schema.showInBeginner).toBe('boolean');
      expect(typeof schema.showInIntermediate).toBe('boolean');
    }
  });

  it('secureDefaults is an object', () => {
    for (const schema of ALL_SCHEMAS) {
      expect(typeof schema.secureDefaults).toBe('object');
      expect(schema.secureDefaults).not.toBeNull();
    }
  });

  it('canConnectTo is an array', () => {
    for (const schema of ALL_SCHEMAS) {
      expect(Array.isArray(schema.canConnectTo)).toBe(true);
    }
  });
});

// ─── Provider groupings ───────────────────────────────────────────────────────

describe('provider groupings', () => {
  it('has AWS schemas', () => {
    expect(getSchemasByProvider('aws').length).toBeGreaterThan(0);
  });

  it('has Azure schemas', () => {
    expect(getSchemasByProvider('azure').length).toBeGreaterThan(0);
  });

  it('has GCP schemas', () => {
    expect(getSchemasByProvider('gcp').length).toBeGreaterThan(0);
  });

  it('provider sums match total (no schema left without a provider)', () => {
    const aws = getSchemasByProvider('aws').length;
    const azure = getSchemasByProvider('azure').length;
    const gcp = getSchemasByProvider('gcp').length;
    expect(aws + azure + gcp).toBe(ALL_SCHEMAS.length);
  });
});

// ─── SCHEMA_MAP ───────────────────────────────────────────────────────────────

describe('SCHEMA_MAP', () => {
  it('contains all schemas by resourceType key', () => {
    for (const schema of ALL_SCHEMAS) {
      expect(SCHEMA_MAP[schema.resourceType]).toBeDefined();
      expect(SCHEMA_MAP[schema.resourceType]!.resourceType).toBe(schema.resourceType);
    }
  });
});

// ─── getSchema ────────────────────────────────────────────────────────────────

describe('getSchema', () => {
  it('returns the correct schema for a known type', () => {
    const schema = getSchema('aws_instance');
    expect(schema).toBeDefined();
    expect(schema!.resourceType).toBe('aws_instance');
    expect(schema!.provider).toBe('aws');
  });

  it('returns undefined for an unknown type', () => {
    expect(getSchema('unknown_resource_xyz')).toBeUndefined();
  });

  it('is case-sensitive', () => {
    expect(getSchema('AWS_INSTANCE')).toBeUndefined();
  });
});

// ─── getBeginnerSchemas ───────────────────────────────────────────────────────

describe('getBeginnerSchemas', () => {
  it('returns only schemas with showInBeginner = true', () => {
    const beginner = getBeginnerSchemas();
    for (const s of beginner) {
      expect(s.showInBeginner).toBe(true);
    }
  });

  it('returns fewer schemas than ALL_SCHEMAS', () => {
    expect(getBeginnerSchemas().length).toBeLessThan(ALL_SCHEMAS.length);
  });

  it('returns at least 5 schemas', () => {
    expect(getBeginnerSchemas().length).toBeGreaterThanOrEqual(5);
  });
});

// ─── getIntermediateSchemas ───────────────────────────────────────────────────

describe('getIntermediateSchemas', () => {
  it('returns only schemas with showInIntermediate = true', () => {
    for (const s of getIntermediateSchemas()) {
      expect(s.showInIntermediate).toBe(true);
    }
  });
});

// ─── searchSchemas ────────────────────────────────────────────────────────────

describe('searchSchemas', () => {
  it('finds schemas matching displayName', () => {
    const results = searchSchemas('EC2');
    expect(results.some(s => s.resourceType === 'aws_instance')).toBe(true);
  });

  it('finds schemas matching resourceType', () => {
    const results = searchSchemas('aws_s3_bucket');
    expect(results.some(s => s.resourceType === 'aws_s3_bucket')).toBe(true);
  });

  it('finds schemas matching tags', () => {
    const results = searchSchemas('lambda');
    expect(results.some(s => s.resourceType === 'aws_lambda_function')).toBe(true);
  });

  it('is case-insensitive', () => {
    const lower = searchSchemas('ec2');
    const upper = searchSchemas('EC2');
    expect(lower.length).toBe(upper.length);
  });

  it('returns empty array for garbage query', () => {
    expect(searchSchemas('zzzzzzz_not_real_xyz')).toHaveLength(0);
  });

  it('returns all schemas for empty string', () => {
    // Empty query matches everything (since '' is in every string)
    expect(searchSchemas('').length).toBe(ALL_SCHEMAS.length);
  });
});
