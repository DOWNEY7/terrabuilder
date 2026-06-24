// ─── Field Validator ─────────────────────────────────────────────────────────
// Validates individual resource property values with type-specific rules.
// Used by the UI PropertiesPanel to give per-field inline feedback.

// Mirror of PropertyType from @terrabuilder/schemas (avoid circular dep)
export type FieldPropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'cidr'
  | 'map'
  | 'list'
  | 'reference'
  | 'password'
  | 'textarea';

export interface FieldValidationResult {
  valid: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'ok';
}

export interface FieldConstraints {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: RegExp;
  patternMessage?: string;
}

const OK: FieldValidationResult = { valid: true, severity: 'ok' };

// ─── CIDR Validation ─────────────────────────────────────────────────────────

const CIDR_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/;

export function validateCIDR(value: string): FieldValidationResult {
  if (!value || value.trim() === '') {
    return { valid: false, severity: 'error', message: 'CIDR block is required' };
  }
  const match = CIDR_RE.exec(value.trim());
  if (!match) {
    return {
      valid: false,
      severity: 'error',
      message: 'Invalid CIDR block. Expected format: x.x.x.x/xx (e.g. 10.0.0.0/16)',
    };
  }
  const [, a, b, c, d, prefix] = match;
  const octets = [Number(a), Number(b), Number(c), Number(d)];
  if (octets.some(o => o > 255)) {
    return { valid: false, severity: 'error', message: 'CIDR contains invalid octets (must be 0–255)' };
  }
  const pref = Number(prefix);
  if (pref > 32) {
    return { valid: false, severity: 'error', message: 'CIDR prefix must be 0–32' };
  }
  return OK;
}

// ─── S3 Bucket Name Validation ───────────────────────────────────────────────

export function validateS3BucketName(value: string): FieldValidationResult {
  if (!value) return { valid: false, severity: 'error', message: 'Bucket name is required' };
  if (value.length < 3) {
    return { valid: false, severity: 'error', message: 'Bucket name must be at least 3 characters' };
  }
  if (value.length > 63) {
    return { valid: false, severity: 'error', message: 'Bucket name must be at most 63 characters' };
  }
  if (/[A-Z]/.test(value)) {
    return { valid: false, severity: 'error', message: 'Bucket name must be lowercase' };
  }
  if (value.startsWith('-') || value.endsWith('-')) {
    return { valid: false, severity: 'error', message: 'Bucket name cannot start or end with a hyphen' };
  }
  if (value.includes('..')) {
    return { valid: false, severity: 'error', message: 'Bucket name cannot contain consecutive dots' };
  }
  if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(value)) {
    return { valid: false, severity: 'error', message: 'Bucket name can only contain lowercase letters, numbers, hyphens, and dots' };
  }
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
    return { valid: false, severity: 'error', message: 'Bucket name cannot be formatted as an IP address' };
  }
  return OK;
}

// ─── Terraform Identifier Validation ─────────────────────────────────────────

const TF_IDENT_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

export function validateTerraformIdentifier(value: string): FieldValidationResult {
  if (!value || value.trim() === '') {
    return { valid: false, severity: 'error', message: 'Name is required' };
  }
  if (!TF_IDENT_RE.test(value)) {
    return {
      valid: false,
      severity: 'warning',
      message: 'Name should start with a letter and only contain letters, numbers, hyphens, or underscores',
    };
  }
  return OK;
}

// ─── Generic Field Validator ──────────────────────────────────────────────────

/**
 * Main entry point — validates a config field value by its property type.
 * Returns a FieldValidationResult with valid/message/severity.
 */
export function validateField(
  key: string,
  value: unknown,
  type: FieldPropertyType,
  constraints: FieldConstraints = {}
): FieldValidationResult {
  const strVal = String(value ?? '');

  // Required check (applies to all types)
  if (constraints.required) {
    if (value === null || value === undefined || strVal.trim() === '') {
      return { valid: false, severity: 'error', message: `${key} is required` };
    }
  }

  // Skip further validation for empty optional fields
  if (!constraints.required && (value === null || value === undefined || strVal.trim() === '')) {
    return OK;
  }

  switch (type) {
    case 'cidr':
      return validateCIDR(strVal);

    case 'number': {
      const n = Number(strVal);
      if (isNaN(n) || !isFinite(n)) {
        return { valid: false, severity: 'error', message: 'Must be a valid number' };
      }
      if (constraints.minValue !== undefined && n < constraints.minValue) {
        return { valid: false, severity: 'error', message: `Must be at least ${constraints.minValue}` };
      }
      if (constraints.maxValue !== undefined && n > constraints.maxValue) {
        return { valid: false, severity: 'error', message: `Must be at most ${constraints.maxValue}` };
      }
      return OK;
    }

    case 'string':
    case 'password':
    case 'textarea': {
      if (constraints.minLength !== undefined && strVal.length < constraints.minLength) {
        return {
          valid: false,
          severity: 'error',
          message: `Must be at least ${constraints.minLength} characters`,
        };
      }
      if (constraints.maxLength !== undefined && strVal.length > constraints.maxLength) {
        return {
          valid: false,
          severity: 'error',
          message: `Must be at most ${constraints.maxLength} characters`,
        };
      }
      if (constraints.pattern && !constraints.pattern.test(strVal)) {
        return {
          valid: false,
          severity: 'error',
          message: constraints.patternMessage ?? 'Invalid format',
        };
      }

      // S3 bucket name special handling
      if (key === 'bucket') {
        return validateS3BucketName(strVal);
      }

      // Leading/trailing whitespace warning
      if (strVal !== strVal.trim()) {
        return {
          valid: false,
          severity: 'warning',
          message: 'Value has leading or trailing whitespace',
        };
      }

      return OK;
    }

    case 'boolean':
      if (typeof value !== 'boolean') {
        return { valid: false, severity: 'error', message: 'Must be true or false' };
      }
      return OK;

    case 'select':
      // Select values are constrained by the UI — just ensure it's non-empty
      if (!strVal) {
        return { valid: false, severity: 'error', message: 'Please select an option' };
      }
      return OK;

    default:
      return OK;
  }
}

// ─── Name Collision Detector ──────────────────────────────────────────────────

/**
 * Check if a display name is already used by another node.
 */
export function checkNameCollision(
  displayName: string,
  currentNodeId: string,
  allNodeIds: string[],
  allNodeNames: string[]
): FieldValidationResult {
  const lower = displayName.toLowerCase().trim();
  for (let i = 0; i < allNodeIds.length; i++) {
    if (allNodeIds[i] === currentNodeId) continue;
    if (allNodeNames[i]?.toLowerCase().trim() === lower) {
      return {
        valid: false,
        severity: 'warning',
        message: `Another resource is already named "${displayName}". Names should be unique to avoid Terraform conflicts.`,
      };
    }
  }
  return OK;
}
