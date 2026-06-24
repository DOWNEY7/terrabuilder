import { describe, it, expect } from 'vitest';
import { emitTerraform } from '../terraform.js';
import type { TBCanvas, TBNode, TBEdge } from '@terrabuilder/engine';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function makeEdge(id: string, source: string, target: string): TBEdge {
  return { id, source, target, type: 'custom', animated: false };
}

function makeCanvas(nodes: TBNode[], edges: TBEdge[] = []): TBCanvas {
  return {
    nodes,
    edges,
    meta: {
      name: 'test-canvas',
      description: '',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

// ─── emitTerraform ────────────────────────────────────────────────────────────

describe('emitTerraform — empty canvas', () => {
  it('returns a comment for empty canvas', () => {
    const output = emitTerraform(makeCanvas([]));
    expect(output).toContain('#');
    expect(output).not.toContain('resource "');
  });
});

describe('emitTerraform — single resources', () => {
  it('generates correct resource block header for EC2', () => {
    const ec2 = makeNode('n1', 'aws_instance', 'aws', 'web-server', {
      ami: 'ami-0c55b159cbfafe1f0',
      instance_type: 't3.micro',
    });
    const output = emitTerraform(makeCanvas([ec2]));
    expect(output).toContain('resource "aws_instance" "web_server"');
  });

  it('includes sanitized name (hyphens → underscores)', () => {
    const ec2 = makeNode('n1', 'aws_instance', 'aws', 'my-app-server', {
      ami: 'ami-abc',
      instance_type: 't3.micro',
    });
    const output = emitTerraform(makeCanvas([ec2]));
    // The resource block name should be sanitized
    expect(output).toContain('resource "aws_instance" "my_app_server"');
    // The tags block should still contain the original display name
    expect(output).toContain('Name        = "my-app-server"');
  });

  it('generates AWS provider block for AWS resources', () => {
    const ec2 = makeNode('n1', 'aws_instance', 'aws', 'server');
    const output = emitTerraform(makeCanvas([ec2]));
    expect(output).toContain('provider "aws"');
  });

  it('generates GCP provider block for GCP resources', () => {
    const gce = makeNode('n1', 'google_compute_instance', 'gcp', 'vm', { machine_type: 'n1-standard-1' });
    const output = emitTerraform(makeCanvas([gce]));
    expect(output).toContain('provider "google"');
  });

  it('generates Azure provider block for Azure resources', () => {
    const vm = makeNode('n1', 'azurerm_linux_virtual_machine', 'azure', 'vm', { size: 'Standard_B1s' });
    const output = emitTerraform(makeCanvas([vm]));
    expect(output).toContain('provider "azurerm"');
  });
});

describe('emitTerraform — value serialization', () => {
  it('emits boolean values unquoted', () => {
    const ec2 = makeNode('n1', 'aws_instance', 'aws', 'server', {
      ami: 'ami-abc',
      instance_type: 't3.micro',
      monitoring: true,
    });
    const output = emitTerraform(makeCanvas([ec2]));
    expect(output).toContain('monitoring = true');
    expect(output).not.toContain('monitoring = "true"');
  });

  it('emits number values unquoted', () => {
    const lambda = makeNode('n1', 'aws_lambda_function', 'aws', 'fn', {
      function_name: 'fn',
      runtime: 'nodejs20.x',
      handler: 'index.handler',
      memory_size: 512,
    });
    const output = emitTerraform(makeCanvas([lambda]));
    expect(output).toContain('memory_size = 512');
    expect(output).not.toContain('memory_size = "512"');
  });

  it('emits string values quoted', () => {
    const s3 = makeNode('n1', 'aws_s3_bucket', 'aws', 'my-bucket', {
      bucket: 'my-bucket-prod',
    });
    const output = emitTerraform(makeCanvas([s3]));
    expect(output).toContain('bucket = "my-bucket-prod"');
  });

  it('includes AWS tags block', () => {
    const ec2 = makeNode('n1', 'aws_instance', 'aws', 'web');
    const output = emitTerraform(makeCanvas([ec2]));
    expect(output).toContain('tags = {');
    expect(output).toContain('ManagedBy');
  });
});

describe('emitTerraform — topological ordering', () => {
  it('VPC appears before subnet in output', () => {
    const vpc = makeNode('vpc', 'aws_vpc', 'aws', 'my-vpc', { cidr_block: '10.0.0.0/16' });
    const subnet = makeNode('sub', 'aws_subnet', 'aws', 'my-subnet', { cidr_block: '10.0.1.0/24' });
    const edge = makeEdge('e1', 'vpc', 'sub');

    const output = emitTerraform(makeCanvas([subnet, vpc], [edge])); // Intentionally reversed
    const vpcPos = output.indexOf('resource "aws_vpc"');
    const subPos = output.indexOf('resource "aws_subnet"');
    expect(vpcPos).toBeLessThan(subPos);
  });

  it('EC2 depends on security group — SG comes first', () => {
    const sg = makeNode('sg', 'aws_security_group', 'aws', 'web-sg', {});
    const ec2 = makeNode('ec2', 'aws_instance', 'aws', 'web', { ami: 'ami-abc', instance_type: 't3.micro' });
    const edge = makeEdge('e1', 'sg', 'ec2');

    const output = emitTerraform(makeCanvas([ec2, sg], [edge])); // reversed order
    const sgPos = output.indexOf('resource "aws_security_group"');
    const ec2Pos = output.indexOf('resource "aws_instance"');
    expect(sgPos).toBeLessThan(ec2Pos);
  });
});

describe('emitTerraform — multi-provider canvas', () => {
  it('includes both AWS and GCP provider blocks', () => {
    const ec2 = makeNode('n1', 'aws_instance', 'aws', 'server', { ami: 'ami-abc', instance_type: 't3.micro' });
    const gce = makeNode('n2', 'google_compute_instance', 'gcp', 'vm', { machine_type: 'n1-standard-1' });
    const output = emitTerraform(makeCanvas([ec2, gce]));
    expect(output).toContain('provider "aws"');
    expect(output).toContain('provider "google"');
  });
});

describe('emitTerraform — connection references', () => {
  it('EC2 references subnet via subnet_id', () => {
    const subnet = makeNode('sub', 'aws_subnet', 'aws', 'app-subnet', { cidr_block: '10.0.1.0/24' });
    const ec2 = makeNode('ec2', 'aws_instance', 'aws', 'web', { ami: 'ami-abc', instance_type: 't3.micro' });
    const edge = makeEdge('e1', 'sub', 'ec2');

    const output = emitTerraform(makeCanvas([subnet, ec2], [edge]));
    expect(output).toContain('subnet_id = aws_subnet.app_subnet');
  });
});
