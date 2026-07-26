import { describe, it, expect } from 'vitest';
import { emitPulumi, generateProjectBundle } from '../index.js';
import type { TBCanvas, TBNode, TBEdge } from '@terrabuilder/engine';

function makeNode(
  id: string,
  resourceType: string,
  provider: 'aws' | 'azure' | 'gcp',
  displayName: string,
  config: Record<string, unknown> = {}
): TBNode {
  return {
    id,
    type: 'resource',
    position: { x: 0, y: 0 },
    data: {
      provider,
      resourceType,
      displayName,
      friendlyName: displayName,
      config,
      securityScore: 100,
      securityFindings: [],
      category: 'Compute',
      icon: '🖥️',
      color: '#e8420a',
    },
  };
}

function makeCanvas(nodes: TBNode[], edges: TBEdge[] = []): TBCanvas {
  return {
    nodes,
    edges,
    meta: {
      name: 'Test Canvas',
      description: 'Test canvas',
      version: '0.2.0',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  };
}

describe('emitPulumi', () => {
  it('handles empty canvas', () => {
    const canvas = makeCanvas([]);
    const code = emitPulumi(canvas);
    expect(code).toContain('No resources configured on canvas');
  });

  it('generates AWS EC2 and S3 resources in TypeScript', () => {
    const ec2 = makeNode('n1', 'aws_instance', 'aws', 'my_server', { instance_type: 't3.micro' });
    const s3 = makeNode('n2', 'aws_s3_bucket', 'aws', 'my_bucket', { bucket: 'app-storage' });
    const canvas = makeCanvas([ec2, s3]);
    const code = emitPulumi(canvas);

    expect(code).toContain('import * as aws from "@pulumi/aws";');
    expect(code).toContain('new aws.ec2.Instance("my_server"');
    expect(code).toContain('new aws.s3.BucketV2("my_bucket"');
    expect(code).toContain('export const myServerId = myServer.id;');
  });

  it('generates project bundle with multiple files', () => {
    const ec2 = makeNode('n1', 'aws_instance', 'aws', 'web_server', { instance_type: 't3.micro' });
    const canvas = makeCanvas([ec2]);
    const files = generateProjectBundle(canvas, 'pulumi');

    expect(files.some(f => f.filename === 'index.ts')).toBe(true);
    expect(files.some(f => f.filename === 'Pulumi.yaml')).toBe(true);
    expect(files.some(f => f.filename === 'package.json')).toBe(true);
    expect(files.some(f => f.filename === 'terrabuilder-architecture.tbp')).toBe(true);
  });
});
