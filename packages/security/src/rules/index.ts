import type { TBNode, TBCanvas, SecurityFinding, Severity } from '@terrabuilder/engine';

// ─── Security Rule Engine ─────────────────────────────────────────────────────

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  clouds: Array<'aws' | 'azure' | 'gcp'>;
  resourceTypes: string[];
  check: (node: TBNode, canvas: TBCanvas) => SecurityFinding | null;
  autoFix?: (config: Record<string, unknown>) => Record<string, unknown>;
}

// ── Rule 1: S3 Bucket Public Access ──────────────────────────────────────────
const s3PublicAccess: SecurityRule = {
  id: 'S3-001',
  name: 'S3 Bucket Public Access',
  description: 'S3 buckets must block all public access to prevent data exposure.',
  severity: 'CRITICAL',
  clouds: ['aws'],
  resourceTypes: ['aws_s3_bucket'],
  check(node) {
    const c = node.data.config;
    if (
      c['block_public_acls'] === false ||
      c['block_public_policy'] === false ||
      c['ignore_public_acls'] === false ||
      c['restrict_public_buckets'] === false
    ) {
      return {
        ruleId: this.id,
        nodeId: node.id,
        severity: this.severity,
        message: 'S3 bucket has public access enabled. All block public access settings must be true.',
        autoFixAvailable: true,
        autoFixDescription: 'Enable all Block Public Access settings.',
      };
    }
    return null;
  },
  autoFix(config) {
    return {
      ...config,
      block_public_acls: true,
      block_public_policy: true,
      ignore_public_acls: true,
      restrict_public_buckets: true,
    };
  },
};

// ── Rule 2: Database Publicly Accessible ──────────────────────────────────────
const dbPubliclyAccessible: SecurityRule = {
  id: 'DB-001',
  name: 'Database Publicly Accessible',
  description: 'Databases must not be publicly accessible to avoid direct internet exposure.',
  severity: 'CRITICAL',
  clouds: ['aws', 'gcp'],
  resourceTypes: ['aws_db_instance', 'google_sql_database_instance'],
  check(node) {
    const c = node.data.config;
    const isPublic =
      c['publicly_accessible'] === true ||
      c['ip_configuration_ipv4_enabled'] === true;
    if (isPublic) {
      return {
        ruleId: this.id,
        nodeId: node.id,
        severity: this.severity,
        message: 'Database is publicly accessible over the internet. This is a critical security risk.',
        autoFixAvailable: true,
        autoFixDescription: "Set publicly_accessible = false.",
      };
    }
    return null;
  },
  autoFix(config) {
    return {
      ...config,
      publicly_accessible: false,
      ip_configuration_ipv4_enabled: false,
    };
  },
};

// ── Rule 3: Security Group Open Ingress ───────────────────────────────────────
const sgOpenIngress: SecurityRule = {
  id: 'SG-001',
  name: 'Security Group Open Ingress (0.0.0.0/0)',
  description: 'Security groups must not allow unrestricted inbound access on sensitive ports.',
  severity: 'CRITICAL',
  clouds: ['aws'],
  resourceTypes: ['aws_security_group'],
  check(node) {
    const c = node.data.config;
    const cidr = c['ingress_cidr_blocks'] as string | undefined;
    const port = c['ingress_from_port'] as number | undefined;
    const sensitivePorts = [22, 3389, 5432, 3306, 27017, 6379, 9200];
    if (cidr === '0.0.0.0/0' && port !== undefined && sensitivePorts.includes(port)) {
      return {
        ruleId: this.id,
        nodeId: node.id,
        severity: this.severity,
        message: `Security group allows unrestricted inbound access on port ${port} (0.0.0.0/0). This exposes sensitive services to the internet.`,
        autoFixAvailable: true,
        autoFixDescription: 'Restrict ingress to your VPC CIDR range (10.0.0.0/8).',
      };
    }
    return null;
  },
  autoFix(config) {
    return { ...config, ingress_cidr_blocks: '10.0.0.0/8' };
  },
};

// ── Rule 4: Storage Encryption at Rest ───────────────────────────────────────
const storageEncryption: SecurityRule = {
  id: 'ENC-001',
  name: 'Storage Encryption at Rest',
  description: 'All storage resources must be encrypted at rest.',
  severity: 'HIGH',
  clouds: ['aws', 'azure', 'gcp'],
  resourceTypes: [
    'aws_db_instance',
    'aws_ebs_volume',
    'azurerm_storage_account',
    'google_storage_bucket',
  ],
  check(node) {
    const c = node.data.config;
    const notEncrypted =
      c['storage_encrypted'] === false ||
      c['encrypted'] === false ||
      c['root_block_device_encrypted'] === false;
    if (notEncrypted) {
      return {
        ruleId: this.id,
        nodeId: node.id,
        severity: this.severity,
        message: 'Storage resource is not encrypted at rest. Enable encryption to protect data.',
        autoFixAvailable: true,
        autoFixDescription: 'Enable encryption at rest.',
      };
    }
    return null;
  },
  autoFix(config) {
    return {
      ...config,
      storage_encrypted: true,
      encrypted: true,
      root_block_device_encrypted: true,
    };
  },
};

// ── Rule 5: IAM Wildcard Actions ─────────────────────────────────────────────
const iamWildcard: SecurityRule = {
  id: 'IAM-001',
  name: 'IAM Wildcard Actions',
  description: 'IAM policies must not use wildcard (*) for actions or resources.',
  severity: 'HIGH',
  clouds: ['aws', 'azure'],
  resourceTypes: ['aws_iam_policy', 'aws_iam_role_policy'],
  check(node) {
    const c = node.data.config;
    const policy = JSON.stringify(c);
    if (policy.includes('"*"') || policy.includes("'*'")) {
      return {
        ruleId: this.id,
        nodeId: node.id,
        severity: this.severity,
        message: 'IAM policy contains wildcard (*) for actions or resources. Use least-privilege permissions.',
        autoFixAvailable: false,
      };
    }
    return null;
  },
};

// ── Rule 6: Audit Logging Disabled ───────────────────────────────────────────
const auditLoggingDisabled: SecurityRule = {
  id: 'LOG-001',
  name: 'CloudTrail / Audit Logs Disabled',
  description: 'Audit logging must be enabled for compliance and incident response.',
  severity: 'HIGH',
  clouds: ['aws'],
  resourceTypes: ['aws_cloudtrail'],
  check(node) {
    const c = node.data.config;
    if (c['is_multi_region_trail'] === false) {
      return {
        ruleId: this.id,
        nodeId: node.id,
        severity: this.severity,
        message: 'CloudTrail is not configured as multi-region. Enable multi-region logging for complete audit coverage.',
        autoFixAvailable: true,
        autoFixDescription: 'Enable multi-region trail.',
      };
    }
    if (c['enable_log_file_validation'] === false) {
      return {
        ruleId: this.id,
        nodeId: node.id,
        severity: this.severity,
        message: 'CloudTrail log file validation is disabled. Enable it to detect log tampering.',
        autoFixAvailable: true,
        autoFixDescription: 'Enable log file validation.',
      };
    }
    return null;
  },
  autoFix(config) {
    return {
      ...config,
      is_multi_region_trail: true,
      enable_log_file_validation: true,
      include_global_service_events: true,
    };
  },
};

// ── Rule 7: TLS Not Enforced ─────────────────────────────────────────────────
const tlsNotEnforced: SecurityRule = {
  id: 'TLS-001',
  name: 'TLS Not Enforced',
  description: 'Load balancers and web apps should redirect HTTP to HTTPS.',
  severity: 'MEDIUM',
  clouds: ['aws', 'azure', 'gcp'],
  resourceTypes: ['aws_alb', 'azurerm_linux_web_app', 'azurerm_linux_function_app'],
  check(node) {
    const c = node.data.config;
    const notEnforced =
      c['default_cache_behavior_viewer_protocol_policy'] === 'allow-all' ||
      c['https_only'] === false;
    if (notEnforced) {
      return {
        ruleId: this.id,
        nodeId: node.id,
        severity: this.severity,
        message: 'TLS is not enforced. HTTP traffic is allowed. Redirect all traffic to HTTPS.',
        autoFixAvailable: true,
        autoFixDescription: 'Enforce HTTPS-only traffic.',
      };
    }
    return null;
  },
  autoFix(config) {
    return {
      ...config,
      https_only: true,
      default_cache_behavior_viewer_protocol_policy: 'redirect-to-https',
    };
  },
};

// ── Rule 8: Resources Without Tags ──────────────────────────────────────────
const resourcesWithoutTags: SecurityRule = {
  id: 'TAG-001',
  name: 'Resources Without Required Tags',
  description: 'All resources should have Name, Environment, and ManagedBy tags for cost management.',
  severity: 'MEDIUM',
  clouds: ['aws', 'azure', 'gcp'],
  resourceTypes: [],  // applies to all resource types
  check(node) {
    const name = node.data.displayName;
    if (!name || name.trim() === '' || name === 'Unnamed' || name === 'resource') {
      return {
        ruleId: this.id,
        nodeId: node.id,
        severity: this.severity,
        message: 'Resource has no display name set. Add a meaningful name for tagging and cost management.',
        autoFixAvailable: false,
      };
    }
    return null;
  },
};

// ── Rule 9: Database No Backups ───────────────────────────────────────────────
const dbNoBackups: SecurityRule = {
  id: 'DB-002',
  name: 'Database Backup Disabled',
  description: 'Databases should have automated backups enabled for disaster recovery.',
  severity: 'HIGH',
  clouds: ['aws', 'gcp'],
  resourceTypes: ['aws_db_instance', 'google_sql_database_instance'],
  check(node) {
    const c = node.data.config;
    const noBackup =
      c['backup_retention_period'] === 0 ||
      c['backup_enabled'] === false;
    if (noBackup) {
      return {
        ruleId: this.id,
        nodeId: node.id,
        severity: this.severity,
        message: 'Database backups are disabled. Enable automated backups to protect against data loss.',
        autoFixAvailable: true,
        autoFixDescription: 'Enable automated backups with 7-day retention.',
      };
    }
    return null;
  },
  autoFix(config) {
    return { ...config, backup_retention_period: 7, backup_enabled: true };
  },
};

// ── Rule 10: RDS Deletion Protection ─────────────────────────────────────────
const dbDeletionProtection: SecurityRule = {
  id: 'DB-003',
  name: 'Database Deletion Protection Disabled',
  description: 'Production databases should have deletion protection enabled.',
  severity: 'MEDIUM',
  clouds: ['aws'],
  resourceTypes: ['aws_db_instance'],
  check(node) {
    if (node.data.config['deletion_protection'] === false) {
      return {
        ruleId: this.id,
        nodeId: node.id,
        severity: this.severity,
        message: 'RDS deletion protection is disabled. Enable it to prevent accidental database deletion.',
        autoFixAvailable: true,
        autoFixDescription: 'Enable deletion protection.',
      };
    }
    return null;
  },
  autoFix(config) {
    return { ...config, deletion_protection: true };
  },
};

// ── Rule 11: Azure Storage Public Access ──────────────────────────────────────
const azureStoragePublicAccess: SecurityRule = {
  id: 'AZ-001',
  name: 'Azure Storage Public Blob Access',
  description: 'Azure Storage accounts should not allow anonymous public access to blobs.',
  severity: 'CRITICAL',
  clouds: ['azure'],
  resourceTypes: ['azurerm_storage_account'],
  check(node) {
    if (node.data.config['allow_nested_items_to_be_public'] === true) {
      return {
        ruleId: this.id,
        nodeId: node.id,
        severity: this.severity,
        message: 'Azure Storage allows public blob access. Disable this to prevent data exposure.',
        autoFixAvailable: true,
        autoFixDescription: 'Set allow_nested_items_to_be_public = false.',
      };
    }
    return null;
  },
  autoFix(config) {
    return { ...config, allow_nested_items_to_be_public: false };
  },
};

// ── Rule 12: GCS Bucket Public Access ────────────────────────────────────────
const gcsBucketPublicAccess: SecurityRule = {
  id: 'GCP-001',
  name: 'GCS Bucket Public Access',
  description: 'GCS buckets should enforce public access prevention.',
  severity: 'CRITICAL',
  clouds: ['gcp'],
  resourceTypes: ['google_storage_bucket'],
  check(node) {
    const c = node.data.config;
    if (c['public_access_prevention'] === 'inherited' || !c['public_access_prevention']) {
      return {
        ruleId: this.id,
        nodeId: node.id,
        severity: this.severity,
        message: 'GCS bucket does not enforce public access prevention. Set public_access_prevention = "enforced".',
        autoFixAvailable: true,
        autoFixDescription: 'Set public_access_prevention = "enforced".',
      };
    }
    return null;
  },
  autoFix(config) {
    return { ...config, public_access_prevention: 'enforced', uniform_bucket_level_access: true };
  },
};

// ── All Rules Registry ────────────────────────────────────────────────────────
export const ALL_RULES: SecurityRule[] = [
  s3PublicAccess,
  dbPubliclyAccessible,
  sgOpenIngress,
  storageEncryption,
  iamWildcard,
  auditLoggingDisabled,
  tlsNotEnforced,
  resourcesWithoutTags,
  dbNoBackups,
  dbDeletionProtection,
  azureStoragePublicAccess,
  gcsBucketPublicAccess,
];

export function getRuleById(id: string): SecurityRule | undefined {
  return ALL_RULES.find(r => r.id === id);
}
