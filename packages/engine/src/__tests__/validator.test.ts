import { describe, it, expect } from 'vitest';
import { validateCanvas, validateNode } from '../validator.js';
import type { TBCanvas, TBNode } from '../graph.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeNode(overrides: Partial<TBNode['data']> & { id?: string } = {}): TBNode {
  const { id = 'n1', ...data } = overrides;
  return {
    id,
    type: 'resource',
    position: { x: 0, y: 0 },
    data: {
      provider: 'aws',
      resourceType: 'aws_instance',
      displayName: 'my-server',
      friendlyName: 'Server',
      config: {
        ami: 'ami-0c55b159cbfafe1f0',
        instance_type: 't3.micro',
      },
      securityScore: 100,
      securityFindings: [],
      category: 'Compute',
      icon: '🖥️',
      color: '#e8420a',
      ...data,
    },
  };
}

function makeCanvas(nodes: TBNode[], edges = []): TBCanvas {
  return {
    nodes,
    edges,
    meta: {
      name: 'test',
      description: '',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

// ─── Display Name Validation ──────────────────────────────────────────────────

describe('validateNode — display name', () => {
  it('empty display name → error', () => {
    const node = makeNode({ displayName: '' });
    const errors = validateNode(node);
    expect(errors.some(e => e.field === 'displayName' && e.severity === 'error')).toBe(true);
  });

  it('whitespace-only name → error', () => {
    const node = makeNode({ displayName: '   ' });
    const errors = validateNode(node);
    expect(errors.some(e => e.field === 'displayName' && e.severity === 'error')).toBe(true);
  });

  it('name with special chars → warning', () => {
    const node = makeNode({ displayName: 'my server!!' });
    const errors = validateNode(node);
    expect(errors.some(e => e.field === 'displayName' && e.severity === 'warning')).toBe(true);
  });

  it('valid name → no displayName errors', () => {
    const node = makeNode({ displayName: 'my-server_01' });
    const errors = validateNode(node);
    expect(errors.filter(e => e.field === 'displayName')).toHaveLength(0);
  });
});

// ─── EC2 Validation ───────────────────────────────────────────────────────────

describe('validateNode — EC2 (aws_instance)', () => {
  it('missing AMI → error', () => {
    const node = makeNode({ config: { instance_type: 't3.micro' } });
    const errors = validateNode(node);
    expect(errors.some(e => e.field === 'ami' && e.severity === 'error')).toBe(true);
  });

  it('missing instance_type → error', () => {
    const node = makeNode({ config: { ami: 'ami-abc' } });
    const errors = validateNode(node);
    expect(errors.some(e => e.field === 'instance_type' && e.severity === 'error')).toBe(true);
  });

  it('valid EC2 → no errors', () => {
    const node = makeNode({ config: { ami: 'ami-0c55b159cbfafe1f0', instance_type: 't3.micro' } });
    const errors = validateNode(node).filter(e => e.severity === 'error');
    expect(errors).toHaveLength(0);
  });
});

// ─── S3 Bucket Validation ─────────────────────────────────────────────────────

describe('validateNode — S3 (aws_s3_bucket)', () => {
  function s3Node(bucket: string) {
    return makeNode({ resourceType: 'aws_s3_bucket', config: { bucket } });
  }

  it('bucket name too short (< 3 chars) → error', () => {
    const errors = validateNode(s3Node('ab'));
    expect(errors.some(e => e.field === 'bucket' && e.severity === 'error')).toBe(true);
  });

  it('bucket name too long (> 63 chars) → error', () => {
    const errors = validateNode(s3Node('a'.repeat(64)));
    expect(errors.some(e => e.field === 'bucket' && e.severity === 'error')).toBe(true);
  });

  it('valid bucket name → no bucket errors', () => {
    const errors = validateNode(s3Node('my-bucket-prod'));
    expect(errors.filter(e => e.field === 'bucket')).toHaveLength(0);
  });
});

// ─── RDS Validation ───────────────────────────────────────────────────────────

describe('validateNode — RDS (aws_db_instance)', () => {
  function rdsNode(config: Record<string, unknown>) {
    return makeNode({ resourceType: 'aws_db_instance', config });
  }

  it('missing engine → error', () => {
    const errors = validateNode(rdsNode({ instance_class: 'db.t3.micro', username: 'admin' }));
    expect(errors.some(e => e.field === 'engine' && e.severity === 'error')).toBe(true);
  });

  it('missing instance_class → error', () => {
    const errors = validateNode(rdsNode({ engine: 'postgres', username: 'admin' }));
    expect(errors.some(e => e.field === 'instance_class' && e.severity === 'error')).toBe(true);
  });

  it('missing username → error', () => {
    const errors = validateNode(rdsNode({ engine: 'postgres', instance_class: 'db.t3.micro' }));
    expect(errors.some(e => e.field === 'username' && e.severity === 'error')).toBe(true);
  });

  it('fully valid RDS → no errors', () => {
    const errors = validateNode(rdsNode({ engine: 'postgres', instance_class: 'db.t3.micro', username: 'admin' }));
    expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
  });
});

// ─── Lambda Validation ────────────────────────────────────────────────────────

describe('validateNode — Lambda (aws_lambda_function)', () => {
  function lambdaNode(config: Record<string, unknown>) {
    return makeNode({ resourceType: 'aws_lambda_function', config });
  }

  it('missing function_name → error', () => {
    const errors = validateNode(lambdaNode({ runtime: 'nodejs20.x', handler: 'index.handler' }));
    expect(errors.some(e => e.field === 'function_name')).toBe(true);
  });

  it('missing runtime → error', () => {
    const errors = validateNode(lambdaNode({ function_name: 'fn', handler: 'index.handler' }));
    expect(errors.some(e => e.field === 'runtime')).toBe(true);
  });

  it('missing handler → error', () => {
    const errors = validateNode(lambdaNode({ function_name: 'fn', runtime: 'nodejs20.x' }));
    expect(errors.some(e => e.field === 'handler')).toBe(true);
  });
});

// ─── Cross-Resource Validation ────────────────────────────────────────────────

describe('validateCanvas — cross-resource', () => {
  it('EC2 not connected to subnet → warning', () => {
    const ec2 = makeNode({ id: 'ec2', resourceType: 'aws_instance' });
    const errors = validateCanvas(makeCanvas([ec2]));
    expect(errors.some(e => e.nodeId === 'ec2' && e.severity === 'warning')).toBe(true);
  });

  it('EC2 connected to subnet → no subnet warning', () => {
    const subnet = makeNode({ id: 'subnet', resourceType: 'aws_subnet' });
    const ec2 = makeNode({ id: 'ec2', resourceType: 'aws_instance' });
    const canvas = makeCanvas([subnet, ec2], [
      { id: 'e1', source: 'subnet', target: 'ec2', type: 'custom', animated: false },
    ] as any);
    const errors = validateCanvas(canvas);
    const subnetWarning = errors.filter(e => e.nodeId === 'ec2' && e.field === 'subnet_id');
    expect(subnetWarning).toHaveLength(0);
  });

  it('empty canvas → no errors', () => {
    expect(validateCanvas(makeCanvas([]))).toHaveLength(0);
  });
});
