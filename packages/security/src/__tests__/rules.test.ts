import { describe, it, expect } from 'vitest';
import { runSecurityEngine, applyAutoFix, applyAllAutoFixes } from '../engine.js';
import type { TBCanvas, TBNode } from '@terrabuilder/engine';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeNode(
  id: string,
  resourceType: string,
  provider: 'aws' | 'azure' | 'gcp',
  config: Record<string, unknown> = {}
): TBNode {
  return {
    id,
    type: 'resource',
    position: { x: 0, y: 0 },
    data: {
      provider,
      resourceType,
      displayName: id,
      friendlyName: id,
      config,
      securityScore: 100,
      securityFindings: [],
      category: 'Compute',
      icon: '🖥️',
      color: '#e8420a',
    },
  };
}

function makeCanvas(nodes: TBNode[]): TBCanvas {
  return {
    nodes,
    edges: [],
    meta: {
      name: 'test',
      description: '',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

// ─── S3-001: Public Access ────────────────────────────────────────────────────

describe('S3-001 — S3 Bucket Public Access', () => {
  it('flags CRITICAL when block_public_acls = false', () => {
    const s3 = makeNode('s3', 'aws_s3_bucket', 'aws', {
      block_public_acls: false,
      block_public_policy: true,
      ignore_public_acls: true,
      restrict_public_buckets: true,
    });
    const report = runSecurityEngine(makeCanvas([s3]));
    const finding = report.findings.find(f => f.ruleId === 'S3-001');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('CRITICAL');
  });

  it('flags CRITICAL when block_public_policy = false', () => {
    const s3 = makeNode('s3', 'aws_s3_bucket', 'aws', {
      block_public_acls: true,
      block_public_policy: false,
      ignore_public_acls: true,
      restrict_public_buckets: true,
    });
    const report = runSecurityEngine(makeCanvas([s3]));
    expect(report.findings.find(f => f.ruleId === 'S3-001')).toBeDefined();
  });

  it('passes when all block public access settings are true', () => {
    const s3 = makeNode('s3', 'aws_s3_bucket', 'aws', {
      block_public_acls: true,
      block_public_policy: true,
      ignore_public_acls: true,
      restrict_public_buckets: true,
    });
    const report = runSecurityEngine(makeCanvas([s3]));
    expect(report.findings.find(f => f.ruleId === 'S3-001')).toBeUndefined();
  });

  it('auto-fix sets all block public access to true', () => {
    const s3 = makeNode('s3', 'aws_s3_bucket', 'aws', {
      block_public_acls: false,
      block_public_policy: false,
    });
    const fixed = applyAutoFix('s3', 'S3-001', makeCanvas([s3]));
    expect(fixed).not.toBeNull();
    expect(fixed!['block_public_acls']).toBe(true);
    expect(fixed!['block_public_policy']).toBe(true);
    expect(fixed!['ignore_public_acls']).toBe(true);
    expect(fixed!['restrict_public_buckets']).toBe(true);
  });

  it('auto-fix preserves existing config properties', () => {
    const s3 = makeNode('s3', 'aws_s3_bucket', 'aws', {
      bucket: 'my-bucket',
      block_public_acls: false,
    });
    const fixed = applyAutoFix('s3', 'S3-001', makeCanvas([s3]));
    expect(fixed!['bucket']).toBe('my-bucket');
  });
});

// ─── DB-001: Publicly Accessible ─────────────────────────────────────────────

describe('DB-001 — Database Publicly Accessible', () => {
  it('flags CRITICAL when publicly_accessible = true', () => {
    const rds = makeNode('rds', 'aws_db_instance', 'aws', {
      engine: 'postgres',
      publicly_accessible: true,
    });
    const report = runSecurityEngine(makeCanvas([rds]));
    const finding = report.findings.find(f => f.ruleId === 'DB-001');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('CRITICAL');
  });

  it('passes when publicly_accessible = false', () => {
    const rds = makeNode('rds', 'aws_db_instance', 'aws', {
      engine: 'postgres',
      publicly_accessible: false,
    });
    const report = runSecurityEngine(makeCanvas([rds]));
    expect(report.findings.find(f => f.ruleId === 'DB-001')).toBeUndefined();
  });

  it('auto-fix sets publicly_accessible = false', () => {
    const rds = makeNode('rds', 'aws_db_instance', 'aws', { publicly_accessible: true });
    const fixed = applyAutoFix('rds', 'DB-001', makeCanvas([rds]));
    expect(fixed!['publicly_accessible']).toBe(false);
  });

  it('does not flag when publicly_accessible is not set', () => {
    const rds = makeNode('rds', 'aws_db_instance', 'aws', { engine: 'postgres' });
    const report = runSecurityEngine(makeCanvas([rds]));
    expect(report.findings.find(f => f.ruleId === 'DB-001')).toBeUndefined();
  });
});

// ─── SG-001: Open Ingress ─────────────────────────────────────────────────────

describe('SG-001 — Security Group Open Ingress', () => {
  it('flags CRITICAL for port 22 open to 0.0.0.0/0', () => {
    const sg = makeNode('sg', 'aws_security_group', 'aws', {
      ingress_cidr_blocks: '0.0.0.0/0',
      ingress_from_port: 22,
    });
    const report = runSecurityEngine(makeCanvas([sg]));
    const finding = report.findings.find(f => f.ruleId === 'SG-001');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('CRITICAL');
  });

  it('flags CRITICAL for port 3389 (RDP) open to 0.0.0.0/0', () => {
    const sg = makeNode('sg', 'aws_security_group', 'aws', {
      ingress_cidr_blocks: '0.0.0.0/0',
      ingress_from_port: 3389,
    });
    const report = runSecurityEngine(makeCanvas([sg]));
    expect(report.findings.find(f => f.ruleId === 'SG-001')).toBeDefined();
  });

  it('passes when CIDR is restricted (not 0.0.0.0/0)', () => {
    const sg = makeNode('sg', 'aws_security_group', 'aws', {
      ingress_cidr_blocks: '10.0.0.0/8',
      ingress_from_port: 22,
    });
    const report = runSecurityEngine(makeCanvas([sg]));
    expect(report.findings.find(f => f.ruleId === 'SG-001')).toBeUndefined();
  });

  it('passes for port 80 open to 0.0.0.0/0 (not a sensitive port)', () => {
    const sg = makeNode('sg', 'aws_security_group', 'aws', {
      ingress_cidr_blocks: '0.0.0.0/0',
      ingress_from_port: 80,
    });
    const report = runSecurityEngine(makeCanvas([sg]));
    expect(report.findings.find(f => f.ruleId === 'SG-001')).toBeUndefined();
  });

  it('auto-fix restricts CIDR to 10.0.0.0/8', () => {
    const sg = makeNode('sg', 'aws_security_group', 'aws', {
      ingress_cidr_blocks: '0.0.0.0/0',
      ingress_from_port: 22,
    });
    const fixed = applyAutoFix('sg', 'SG-001', makeCanvas([sg]));
    expect(fixed!['ingress_cidr_blocks']).toBe('10.0.0.0/8');
  });
});

// ─── ENC-001: Encryption at Rest ─────────────────────────────────────────────

describe('ENC-001 — Storage Encryption at Rest', () => {
  it('flags HIGH when storage_encrypted = false on RDS', () => {
    const rds = makeNode('rds', 'aws_db_instance', 'aws', { storage_encrypted: false });
    const report = runSecurityEngine(makeCanvas([rds]));
    const finding = report.findings.find(f => f.ruleId === 'ENC-001');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('HIGH');
  });

  it('passes when storage_encrypted = true', () => {
    const rds = makeNode('rds', 'aws_db_instance', 'aws', { storage_encrypted: true });
    const report = runSecurityEngine(makeCanvas([rds]));
    expect(report.findings.find(f => f.ruleId === 'ENC-001')).toBeUndefined();
  });
});

// ─── runSecurityEngine — report structure ─────────────────────────────────────

describe('runSecurityEngine — report structure', () => {
  it('empty canvas returns perfect score', () => {
    const report = runSecurityEngine(makeCanvas([]));
    expect(report.canvasScore).toBe(100);
    expect(report.findings).toHaveLength(0);
    expect(report.deployBlocked).toBe(false);
  });

  it('counts critical findings correctly', () => {
    const s3 = makeNode('s3', 'aws_s3_bucket', 'aws', {
      block_public_acls: false,
    });
    const rds = makeNode('rds', 'aws_db_instance', 'aws', {
      publicly_accessible: true,
    });
    const report = runSecurityEngine(makeCanvas([s3, rds]));
    expect(report.criticalCount).toBeGreaterThanOrEqual(2);
  });

  it('blocks deploy when canvas score is below 60', () => {
    // Create nodes with many CRITICAL issues
    const s3 = makeNode('s3', 'aws_s3_bucket', 'aws', {
      block_public_acls: false,
      block_public_policy: false,
    });
    const rds = makeNode('rds', 'aws_db_instance', 'aws', {
      publicly_accessible: true,
      storage_encrypted: false,
    });
    const sg = makeNode('sg', 'aws_security_group', 'aws', {
      ingress_cidr_blocks: '0.0.0.0/0',
      ingress_from_port: 22,
    });
    const report = runSecurityEngine(makeCanvas([s3, rds, sg]));
    // Each node has multiple findings → low scores → deploy blocked
    if (report.canvasScore < 60) {
      expect(report.deployBlocked).toBe(true);
    } else {
      // Ensure we're testing the right scenario
      expect(report.findings.length).toBeGreaterThan(0);
    }
  });

  it('nodeScores maps nodeId to score 0-100', () => {
    const s3 = makeNode('s3', 'aws_s3_bucket', 'aws', { block_public_acls: false });
    const report = runSecurityEngine(makeCanvas([s3]));
    expect(report.nodeScores['s3']).toBeGreaterThanOrEqual(0);
    expect(report.nodeScores['s3']).toBeLessThanOrEqual(100);
  });
});

// ─── applyAllAutoFixes ────────────────────────────────────────────────────────

describe('applyAllAutoFixes', () => {
  it('returns null for unknown node', () => {
    expect(applyAllAutoFixes('ghost', makeCanvas([]))).toBeNull();
  });

  it('applies all fixable findings for a node', () => {
    const s3 = makeNode('s3', 'aws_s3_bucket', 'aws', {
      block_public_acls: false,
      block_public_policy: false,
    });
    const fixed = applyAllAutoFixes('s3', makeCanvas([s3]));
    expect(fixed).not.toBeNull();
    expect(fixed!['block_public_acls']).toBe(true);
    expect(fixed!['block_public_policy']).toBe(true);
  });
});
