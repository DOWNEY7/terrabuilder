import type { TBNode, TBCanvas, ValidationError } from './graph.js';

// ─── Validator ───────────────────────────────────────────────────────────────
// Validates canvas state — required fields, type correctness, cross-resource rules.

export function validateCanvas(canvas: TBCanvas): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const node of canvas.nodes) {
    errors.push(...validateNode(node));
  }
  errors.push(...validateCrossResource(canvas));
  return errors;
}

export function validateNode(node: TBNode): ValidationError[] {
  const errors: ValidationError[] = [];
  const { config, resourceType, displayName } = node.data;

  // Every node must have a display name
  if (!displayName || displayName.trim() === '') {
    errors.push({
      nodeId: node.id,
      field: 'displayName',
      message: 'Resource must have a name',
      severity: 'error',
    });
  }

  // Name must be a valid identifier
  if (displayName && /[^a-zA-Z0-9_-]/.test(displayName)) {
    errors.push({
      nodeId: node.id,
      field: 'displayName',
      message: 'Name should only contain letters, numbers, hyphens, and underscores',
      severity: 'warning',
    });
  }

  // Resource-specific validation
  const resourceValidators: Record<string, (config: Record<string, unknown>) => ValidationError[]> = {
    aws_instance: validateEC2,
    aws_s3_bucket: validateS3,
    aws_db_instance: validateRDS,
    aws_lambda_function: validateLambda,
    azurerm_virtual_machine: validateAzureVM,
    google_compute_instance: validateGCEInstance,
  };

  const validator = resourceValidators[resourceType];
  if (validator) {
    const resourceErrors = validator(config);
    errors.push(...resourceErrors.map(e => ({ ...e, nodeId: node.id })));
  }

  return errors;
}

function validateEC2(config: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!config['ami']) {
    errors.push({ nodeId: '', field: 'ami', message: 'AMI ID is required', severity: 'error' });
  }
  if (!config['instance_type']) {
    errors.push({ nodeId: '', field: 'instance_type', message: 'Instance type is required', severity: 'error' });
  }
  return errors;
}

function validateS3(config: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  const bucket = config['bucket'] as string | undefined;
  if (bucket && (bucket.length < 3 || bucket.length > 63)) {
    errors.push({ nodeId: '', field: 'bucket', message: 'Bucket name must be 3–63 characters', severity: 'error' });
  }
  return errors;
}

function validateRDS(config: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!config['engine']) {
    errors.push({ nodeId: '', field: 'engine', message: 'Database engine is required', severity: 'error' });
  }
  if (!config['instance_class']) {
    errors.push({ nodeId: '', field: 'instance_class', message: 'Instance class is required', severity: 'error' });
  }
  if (!config['username']) {
    errors.push({ nodeId: '', field: 'username', message: 'Master username is required', severity: 'error' });
  }
  return errors;
}

function validateLambda(config: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!config['function_name']) {
    errors.push({ nodeId: '', field: 'function_name', message: 'Function name is required', severity: 'error' });
  }
  if (!config['runtime']) {
    errors.push({ nodeId: '', field: 'runtime', message: 'Runtime is required', severity: 'error' });
  }
  if (!config['handler']) {
    errors.push({ nodeId: '', field: 'handler', message: 'Handler is required', severity: 'error' });
  }
  return errors;
}

function validateAzureVM(config: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!config['size']) {
    errors.push({ nodeId: '', field: 'size', message: 'VM size is required', severity: 'error' });
  }
  if (!config['admin_username']) {
    errors.push({ nodeId: '', field: 'admin_username', message: 'Admin username is required', severity: 'error' });
  }
  return errors;
}

function validateGCEInstance(config: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!config['machine_type']) {
    errors.push({ nodeId: '', field: 'machine_type', message: 'Machine type is required', severity: 'error' });
  }
  return errors;
}

function validateCrossResource(canvas: TBCanvas): ValidationError[] {
  const errors: ValidationError[] = [];
  // Example cross-resource rule: EC2 should be in a VPC (connected to a subnet)
  const ec2Nodes = canvas.nodes.filter(n => n.data.resourceType === 'aws_instance');
  const subnetIds = new Set(
    canvas.edges.filter(e => {
      const src = canvas.nodes.find(n => n.id === e.source);
      return src?.data.resourceType === 'aws_subnet';
    }).map(e => e.target)
  );
  for (const ec2 of ec2Nodes) {
    if (!subnetIds.has(ec2.id)) {
      errors.push({
        nodeId: ec2.id,
        field: 'subnet_id',
        message: 'EC2 instance should be connected to a subnet',
        severity: 'warning',
      });
    }
  }
  return errors;
}
