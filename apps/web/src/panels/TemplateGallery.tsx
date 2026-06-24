import { X } from 'lucide-react';
import { useCanvasStore } from '../store/canvas';
import type { CanvasTemplate } from '@terrabuilder/engine';
import type { Provider } from '@terrabuilder/engine';

// ─── Built-in Templates ───────────────────────────────────────────────────────
// 5 starter templates aligned with user's choices

const TEMPLATES: Array<{
  id: string;
  name: string;
  provider: Provider;
  icon: string;
  description: string;
  tags: string[];
  template: CanvasTemplate;
}> = [
  {
    id: 'aws-3tier',
    name: '3-Tier Web App',
    provider: 'aws',
    icon: '🏗️',
    description: 'Classic web → app → database architecture with ALB, EC2, and RDS. Production-ready with security groups.',
    tags: ['Web', 'EC2', 'RDS', 'ALB'],
    template: {
      name: '3-Tier AWS Web App',
      canvas: {
        nodes: [
          {
            id: 't1-alb', type: 'resource', position: { x: 250, y: 50 },
            data: {
              provider: 'aws', resourceType: 'aws_alb', displayName: 'alb-web',
              friendlyName: 'Load Balancer', icon: '⚖️', color: '#e8420a',
              category: 'Network', config: { name: 'alb-web', internal: false, load_balancer_type: 'application' },
              securityScore: 95, securityFindings: [],
            },
          },
          {
            id: 't1-ec2', type: 'resource', position: { x: 250, y: 200 },
            data: {
              provider: 'aws', resourceType: 'aws_instance', displayName: 'web-server',
              friendlyName: 'Web Server', icon: '🖥️', color: '#e8420a',
              category: 'Compute', config: { instance_type: 't3.small', ami: 'ami-0c55b159cbfafe1f0' },
              securityScore: 90, securityFindings: [],
            },
          },
          {
            id: 't1-rds', type: 'resource', position: { x: 250, y: 380 },
            data: {
              provider: 'aws', resourceType: 'aws_db_instance', displayName: 'main-db',
              friendlyName: 'Database', icon: '🗄️', color: '#e8420a',
              category: 'Database',
              config: { engine: 'postgres', engine_version: '15.4', instance_class: 'db.t3.micro', storage_encrypted: true, multi_az: true, backup_retention_period: 7, deletion_protection: true, publicly_accessible: false },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 't1-sg-web', type: 'resource', position: { x: 520, y: 200 },
            data: {
              provider: 'aws', resourceType: 'aws_security_group', displayName: 'sg-web',
              friendlyName: 'Web Firewall', icon: '🛡️', color: '#e8420a',
              category: 'Security', config: { name: 'sg-web', ingress_from_port: 443, ingress_cidr_blocks: '0.0.0.0/0' },
              securityScore: 85, securityFindings: [],
            },
          },
          {
            id: 't1-s3', type: 'resource', position: { x: -20, y: 200 },
            data: {
              provider: 'aws', resourceType: 'aws_s3_bucket', displayName: 'assets-bucket',
              friendlyName: 'Static Assets', icon: '🪣', color: '#e8420a',
              category: 'Storage',
              config: { bucket: 'assets-bucket', versioning_enabled: true, sse_algorithm: 'AES256', block_public_acls: true, block_public_policy: true, ignore_public_acls: true, restrict_public_buckets: true },
              securityScore: 100, securityFindings: [],
            },
          },
        ],
        edges: [
          { id: 'te1', source: 't1-alb', target: 't1-ec2', type: 'custom', animated: true },
          { id: 'te2', source: 't1-ec2', target: 't1-rds', type: 'custom', animated: true },
          { id: 'te3', source: 't1-sg-web', target: 't1-ec2', type: 'custom', animated: false },
        ],
        meta: {
          name: '3-Tier AWS Web App', description: 'Classic web tier architecture',
          version: '1.0.0', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        },
      },
    },
  },

  {
    id: 'aws-serverless',
    name: 'Serverless API',
    provider: 'aws',
    icon: '⚡',
    description: 'API Gateway → Lambda → DynamoDB with CloudFront and S3 for the frontend. Pay-per-request, zero cold start.',
    tags: ['Serverless', 'Lambda', 'DynamoDB', 'API Gateway'],
    template: {
      name: 'Serverless AWS API',
      canvas: {
        nodes: [
          {
            id: 'sl-cf', type: 'resource', position: { x: 200, y: 50 },
            data: {
              provider: 'aws', resourceType: 'aws_cloudfront_distribution', displayName: 'cdn',
              friendlyName: 'CDN', icon: '🌐', color: '#e8420a',
              category: 'CDN & DNS', config: { price_class: 'PriceClass_100', default_cache_behavior_viewer_protocol_policy: 'redirect-to-https', enabled: true },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'sl-s3', type: 'resource', position: { x: -50, y: 200 },
            data: {
              provider: 'aws', resourceType: 'aws_s3_bucket', displayName: 'frontend-bucket',
              friendlyName: 'Frontend', icon: '🪣', color: '#e8420a',
              category: 'Storage', config: { bucket: 'frontend', versioning_enabled: false, block_public_acls: true, block_public_policy: true, ignore_public_acls: true, restrict_public_buckets: true },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'sl-lam', type: 'resource', position: { x: 350, y: 200 },
            data: {
              provider: 'aws', resourceType: 'aws_lambda_function', displayName: 'api-handler',
              friendlyName: 'API Function', icon: '⚡', color: '#e8420a',
              category: 'Serverless', config: { runtime: 'nodejs20.x', handler: 'index.handler', memory_size: 512, timeout: 30, function_name: 'api-handler' },
              securityScore: 90, securityFindings: [],
            },
          },
          {
            id: 'sl-ddb', type: 'resource', position: { x: 350, y: 400 },
            data: {
              provider: 'aws', resourceType: 'aws_dynamodb_table', displayName: 'app-table',
              friendlyName: 'NoSQL Table', icon: '📋', color: '#e8420a',
              category: 'Database', config: { billing_mode: 'PAY_PER_REQUEST', point_in_time_recovery_enabled: true, server_side_encryption_enabled: true },
              securityScore: 100, securityFindings: [],
            },
          },
        ],
        edges: [
          { id: 'se1', source: 'sl-cf', target: 'sl-s3', type: 'custom', animated: true },
          { id: 'se2', source: 'sl-cf', target: 'sl-lam', type: 'custom', animated: true },
          { id: 'se3', source: 'sl-lam', target: 'sl-ddb', type: 'custom', animated: true },
        ],
        meta: {
          name: 'Serverless AWS API', description: 'CloudFront + Lambda + DynamoDB',
          version: '1.0.0', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        },
      },
    },
  },

  {
    id: 'aws-static',
    name: 'Static Site (AWS)',
    provider: 'aws',
    icon: '🌍',
    description: 'S3 + CloudFront + Route53 for a globally distributed, cost-effective static website.',
    tags: ['Static', 'S3', 'CloudFront', 'CDN'],
    template: {
      name: 'AWS Static Site',
      canvas: {
        nodes: [
          {
            id: 'ss-cf', type: 'resource', position: { x: 200, y: 50 },
            data: {
              provider: 'aws', resourceType: 'aws_cloudfront_distribution', displayName: 'cdn-distribution',
              friendlyName: 'Global CDN', icon: '🌐', color: '#e8420a',
              category: 'CDN & DNS', config: { price_class: 'PriceClass_All', enabled: true, default_cache_behavior_viewer_protocol_policy: 'redirect-to-https' },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'ss-s3', type: 'resource', position: { x: 200, y: 220 },
            data: {
              provider: 'aws', resourceType: 'aws_s3_bucket', displayName: 'website-bucket',
              friendlyName: 'Website Files', icon: '🪣', color: '#e8420a',
              category: 'Storage', config: { bucket: 'my-website', versioning_enabled: true, block_public_acls: true, block_public_policy: true, ignore_public_acls: true, restrict_public_buckets: true, sse_algorithm: 'AES256' },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'ss-r53', type: 'resource', position: { x: 200, y: 390 },
            data: {
              provider: 'aws', resourceType: 'aws_route53_zone', displayName: 'dns-zone',
              friendlyName: 'DNS Zone', icon: '🌐', color: '#e8420a',
              category: 'CDN & DNS', config: { name: 'example.com' },
              securityScore: 100, securityFindings: [],
            },
          },
        ],
        edges: [
          { id: 'sse1', source: 'ss-cf', target: 'ss-s3', type: 'custom', animated: true },
          { id: 'sse2', source: 'ss-r53', target: 'ss-cf', type: 'custom', animated: false },
        ],
        meta: {
          name: 'AWS Static Site', description: 'S3 + CloudFront static website',
          version: '1.0.0', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        },
      },
    },
  },

  {
    id: 'azure-webapp',
    name: 'Web App (Azure)',
    provider: 'azure',
    icon: '△',
    description: 'App Service + Azure SQL + Key Vault + Application Insights for a managed web application on Azure.',
    tags: ['App Service', 'Azure SQL', 'Key Vault'],
    template: {
      name: 'Azure Web App',
      canvas: {
        nodes: [
          {
            id: 'az-app', type: 'resource', position: { x: 200, y: 50 },
            data: {
              provider: 'azure', resourceType: 'azurerm_linux_web_app', displayName: 'web-app',
              friendlyName: 'Web App', icon: '🌐', color: '#0078d4',
              category: 'Compute', config: { name: 'my-web-app', location: 'eastus', os_type: 'Linux', https_only: true },
              securityScore: 95, securityFindings: [],
            },
          },
          {
            id: 'az-sql', type: 'resource', position: { x: 200, y: 230 },
            data: {
              provider: 'azure', resourceType: 'azurerm_sql_database', displayName: 'prod-db',
              friendlyName: 'Database', icon: '🗄️', color: '#ff9800',
              category: 'Database', config: { name: 'prod-db', sku_name: 'S1', zone_redundant: true, transparent_data_encryption_enabled: true },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'az-kv', type: 'resource', position: { x: 450, y: 140 },
            data: {
              provider: 'azure', resourceType: 'azurerm_key_vault', displayName: 'secrets-vault',
              friendlyName: 'Secret Store', icon: '🔐', color: '#9c27b0',
              category: 'Security', config: { name: 'secrets-vault', sku_name: 'standard', soft_delete_retention_days: 90, purge_protection_enabled: true },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'az-stor', type: 'resource', position: { x: -50, y: 140 },
            data: {
              provider: 'azure', resourceType: 'azurerm_storage_account', displayName: 'app-storage',
              friendlyName: 'Storage', icon: '🪣', color: '#0078d4',
              category: 'Storage', config: { name: 'appstorage', account_tier: 'Standard', account_replication_type: 'LRS', min_tls_version: 'TLS1_2', allow_nested_items_to_be_public: false },
              securityScore: 100, securityFindings: [],
            },
          },
        ],
        edges: [
          { id: 'aze1', source: 'az-app', target: 'az-sql', type: 'custom', animated: true },
          { id: 'aze2', source: 'az-app', target: 'az-kv', type: 'custom', animated: false },
          { id: 'aze3', source: 'az-app', target: 'az-stor', type: 'custom', animated: false },
        ],
        meta: {
          name: 'Azure Web App', description: 'App Service + SQL + Key Vault',
          version: '1.0.0', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        },
      },
    },
  },

  {
    id: 'gcp-ml',
    name: 'ML Pipeline (GCP)',
    provider: 'gcp',
    icon: '🤖',
    description: 'Cloud Storage → BigQuery → Cloud Functions pipeline for ML training data ingestion and processing.',
    tags: ['BigQuery', 'Cloud Run', 'ML', 'GCS'],
    template: {
      name: 'GCP ML Pipeline',
      canvas: {
        nodes: [
          {
            id: 'gcp-gcs', type: 'resource', position: { x: 50, y: 200 },
            data: {
              provider: 'gcp', resourceType: 'google_storage_bucket', displayName: 'raw-data',
              friendlyName: 'Raw Data Lake', icon: '🪣', color: '#34a853',
              category: 'Storage', config: { name: 'raw-data-lake', location: 'US', storage_class: 'STANDARD', public_access_prevention: 'enforced', uniform_bucket_level_access: true, versioning_enabled: true },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'gcp-fn', type: 'resource', position: { x: 280, y: 100 },
            data: {
              provider: 'gcp', resourceType: 'google_cloudfunctions2_function', displayName: 'data-processor',
              friendlyName: 'Data Processor', icon: '⚡', color: '#fbbc04',
              category: 'Serverless', config: { name: 'data-processor', runtime: 'python312', available_memory: '512M', location: 'us-central1' },
              securityScore: 90, securityFindings: [],
            },
          },
          {
            id: 'gcp-bq', type: 'resource', position: { x: 280, y: 300 },
            data: {
              provider: 'gcp', resourceType: 'google_bigquery_dataset', displayName: 'ml-dataset',
              friendlyName: 'ML Data Warehouse', icon: '📊', color: '#4285f4',
              category: 'Analytics', config: { dataset_id: 'ml_training_data', location: 'US' },
              securityScore: 95, securityFindings: [],
            },
          },
          {
            id: 'gcp-cr', type: 'resource', position: { x: 510, y: 200 },
            data: {
              provider: 'gcp', resourceType: 'google_cloud_run_v2_service', displayName: 'ml-api',
              friendlyName: 'ML API', icon: '🚀', color: '#34a853',
              category: 'Serverless', config: { name: 'ml-api', location: 'us-central1', container_image: 'gcr.io/cloudrun/hello', max_instance_count: 10 },
              securityScore: 90, securityFindings: [],
            },
          },
          {
            id: 'gcp-pub', type: 'resource', position: { x: 50, y: 400 },
            data: {
              provider: 'gcp', resourceType: 'google_pubsub_topic', displayName: 'data-events',
              friendlyName: 'Event Stream', icon: '📨', color: '#ea4335',
              category: 'Messaging', config: { name: 'data-events', message_retention_duration: '86400s' },
              securityScore: 100, securityFindings: [],
            },
          },
        ],
        edges: [
          { id: 'ge1', source: 'gcp-gcs', target: 'gcp-fn', type: 'custom', animated: true },
          { id: 'ge2', source: 'gcp-fn', target: 'gcp-bq', type: 'custom', animated: true },
          { id: 'ge3', source: 'gcp-bq', target: 'gcp-cr', type: 'custom', animated: true },
          { id: 'ge4', source: 'gcp-pub', target: 'gcp-fn', type: 'custom', animated: false },
        ],
        meta: {
          name: 'GCP ML Pipeline', description: 'GCS → Functions → BigQuery → Cloud Run',
          version: '1.0.0', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        },
      },
    },
  },

  {
    id: 'aws-stock-pipeline',
    name: 'Real-time Stock Pipeline',
    provider: 'aws',
    icon: '📈',
    description: 'Real-time stock market pipeline: Kinesis → Lambda → S3 & DynamoDB. Analyzed via Athena with CloudWatch observability.',
    tags: ['Streaming', 'Kinesis', 'Lambda', 'Athena'],
    template: {
      name: 'Real-time Stock Pipeline',
      canvas: {
        nodes: [
          {
            id: 'sp-kinesis', type: 'resource', position: { x: 50, y: 250 },
            data: {
              provider: 'aws', resourceType: 'aws_kinesis_stream', displayName: 'stock-market-stream',
              friendlyName: 'Kinesis Stream', icon: '🌊', color: '#8e24aa', category: 'Analytics',
              config: { name: 'stock-market-stream', shard_count: 1 },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'sp-role', type: 'resource', position: { x: 350, y: 50 },
            data: {
              provider: 'aws', resourceType: 'aws_iam_role', displayName: 'lambda_role',
              friendlyName: 'IAM Role (Least-Privilege)', icon: '🛡️', color: '#e53935', category: 'Security',
              config: { name: 'stock-processor-role', assume_role_service: 'lambda.amazonaws.com' },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'sp-policy', type: 'resource', position: { x: 650, y: 50 },
            data: {
              provider: 'aws', resourceType: 'aws_iam_role_policy', displayName: 'lambda_policy',
              friendlyName: 'IAM Policy', icon: '📜', color: '#e53935', category: 'Security',
              config: { name: 'stock-processor-policy', policy: '<<RAW>>jsonencode({\n  Version = "2012-10-17"\n  Statement = [\n    {\n      Action = ["kinesis:GetRecords", "kinesis:GetShardIterator", "kinesis:DescribeStream", "kinesis:ListShards"]\n      Effect   = "Allow"\n      Resource = aws_kinesis_stream.stock_market_stream.arn\n    },\n    {\n      Action = ["s3:PutObject"]\n      Effect   = "Allow"\n      Resource = "${aws_s3_bucket.raw_data_bucket.arn}/*"\n    },\n    {\n      Action = ["dynamodb:PutItem"]\n      Effect   = "Allow"\n      Resource = aws_dynamodb_table.stock_table.arn\n    },\n    {\n      Action = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]\n      Effect   = "Allow"\n      Resource = "*"\n    }\n  ]\n})' },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'sp-lambda', type: 'resource', position: { x: 350, y: 250 },
            data: {
              provider: 'aws', resourceType: 'aws_lambda_function', displayName: 'stock_processor',
              friendlyName: 'Lambda Processor', icon: '⚡', color: '#ff9800', category: 'Compute',
              config: { function_name: 'stock-processor', runtime: 'python3.9', handler: 'lambda_processor.lambda_handler', environment: '<<RAW>>{\n    variables = {\n      S3_BUCKET_NAME      = aws_s3_bucket.raw_data_bucket.bucket\n      DYNAMODB_TABLE_NAME = aws_dynamodb_table.stock_table.name\n    }\n  }', filename: '../src/lambda_processor.zip', source_code_hash: '<<RAW>>filebase64sha256("../src/lambda_processor.zip")' },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'sp-s3', type: 'resource', position: { x: 650, y: 250 },
            data: {
              provider: 'aws', resourceType: 'aws_s3_bucket', displayName: 'raw_data_bucket',
              friendlyName: 'S3 Storage', icon: '🪣', color: '#2196f3', category: 'Storage',
              config: { bucket: 'stock-raw-data', block_public_acls: true, block_public_policy: true, ignore_public_acls: true, restrict_public_buckets: true, versioning_enabled: true },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'sp-ddb', type: 'resource', position: { x: 650, y: 450 },
            data: {
              provider: 'aws', resourceType: 'aws_dynamodb_table', displayName: 'stock_table',
              friendlyName: 'DynamoDB Table', icon: '🗄️', color: '#4caf50', category: 'Database',
              config: { name: 'stock-prices', billing_mode: 'PAY_PER_REQUEST', hash_key: 'ticker', range_key: 'timestamp', attribute: '<<RAW>>[\n    {\n      name = "ticker"\n      type = "S"\n    },\n    {\n      name = "timestamp"\n      type = "S"\n    }\n  ]' },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'sp-logs', type: 'resource', position: { x: 350, y: 450 },
            data: {
              provider: 'aws', resourceType: 'aws_cloudwatch_log_group', displayName: 'lambda_log_group',
              friendlyName: 'CloudWatch Logs', icon: '📋', color: '#d81b60', category: 'Management',
              config: { name: '<<RAW>>"/aws/lambda/${aws_lambda_function.stock_processor.function_name}"', retention_in_days: 14 },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'sp-alarm', type: 'resource', position: { x: 350, y: 600 },
            data: {
              provider: 'aws', resourceType: 'aws_cloudwatch_metric_alarm', displayName: 'iterator_age_alarm',
              friendlyName: 'Iterator Age Alarm', icon: '🔔', color: '#d81b60', category: 'Management',
              config: { alarm_name: 'iterator-age-alarm', comparison_operator: 'GreaterThanOrEqualToThreshold', evaluation_periods: 1, metric_name: 'GetRecords.IteratorAgeMilliseconds', namespace: 'AWS/Kinesis', period: 60, statistic: 'Maximum', threshold: 60000, alarm_description: 'Monitors the iterator age of the Kinesis stream.', dimensions: '<<RAW>>{\n    StreamName = aws_kinesis_stream.stock_market_stream.name\n  }' },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'sp-athena-db', type: 'resource', position: { x: 950, y: 250 },
            data: {
              provider: 'aws', resourceType: 'aws_athena_database', displayName: 'stock_database',
              friendlyName: 'Athena DB', icon: '📊', color: '#8e24aa', category: 'Analytics',
              config: { name: 'stock_db', bucket: '<<RAW>>aws_s3_bucket.raw_data_bucket.bucket' },
              securityScore: 100, securityFindings: [],
            },
          },
          {
            id: 'sp-athena-wg', type: 'resource', position: { x: 950, y: 400 },
            data: {
              provider: 'aws', resourceType: 'aws_athena_workgroup', displayName: 'stock_workgroup',
              friendlyName: 'Athena Workgroup', icon: '⚙️', color: '#8e24aa', category: 'Analytics',
              config: { name: 'stock_workgroup', state: 'ENABLED', configuration: '<<RAW>>{\n    result_configuration {\n      output_location = "s3://${aws_s3_bucket.raw_data_bucket.bucket}/athena_results/"\n    }\n  }' },
              securityScore: 100, securityFindings: [],
            },
          },
        ],
        edges: [
          { id: 'spe1', source: 'sp-role', target: 'sp-policy', type: 'custom', animated: false },
          { id: 'spe2', source: 'sp-kinesis', target: 'sp-lambda', type: 'custom', animated: true },
          { id: 'spe3', source: 'sp-lambda', target: 'sp-s3', type: 'custom', animated: true },
          { id: 'spe4', source: 'sp-lambda', target: 'sp-ddb', type: 'custom', animated: true },
          { id: 'spe5', source: 'sp-lambda', target: 'sp-logs', type: 'custom', animated: false },
          { id: 'spe6', source: 'sp-s3', target: 'sp-athena-db', type: 'custom', animated: false },
        ],
        meta: {
          name: 'Real-time Stock Pipeline', description: 'Kinesis → Lambda → S3 & DynamoDB',
          version: '1.0.0', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        },
      },
    },
  },
];

const PROVIDER_COLORS: Record<string, string> = {
  aws: 'var(--aws)',
  azure: 'var(--azure)',
  gcp: 'var(--gcp)',
};

export function TemplateGallery() {
  const { setShowTemplates, loadTemplate } = useCanvasStore();

  return (
    <div className="template-overlay" onClick={(e) => e.target === e.currentTarget && setShowTemplates(false)}>
      <div className="template-modal slide-up">
        <div className="template-modal-header">
          <div>
            <div className="template-modal-title">
              Start from a <span>Template</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              6 production-ready architectures to get you started
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={() => setShowTemplates(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="template-modal-grid">
          {TEMPLATES.map(t => (
            <div
              key={t.id}
              className="template-card"
              onClick={() => loadTemplate(t.template)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="template-icon">{t.icon}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1,
                  textTransform: 'uppercase', padding: '2px 6px',
                  borderRadius: 3, background: `${PROVIDER_COLORS[t.provider]}15`,
                  color: PROVIDER_COLORS[t.provider], border: `1px solid ${PROVIDER_COLORS[t.provider]}30`,
                }}>
                  {t.provider.toUpperCase()}
                </span>
              </div>
              <div className="template-name">{t.name}</div>
              <div className="template-desc">{t.description}</div>
              <div className="template-meta">
                {t.tags.map(tag => (
                  <span key={tag} className="template-tag">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
