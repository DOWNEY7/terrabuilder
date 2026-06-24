import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { TBNode, TBNodeData } from '@terrabuilder/engine';
import { useCanvasStore } from '../../store/canvas';

type ResourceNodeProps = NodeProps<TBNode>;

export const ResourceNode = memo(({ id, data, selected }: ResourceNodeProps) => {
  const { mode } = useCanvasStore();
  const isBeginner = mode === 'beginner';

  const score = data.securityScore;
  const scoreClass = score >= 80 ? 'good' : score >= 50 ? 'warn' : 'bad';
  const criticalFindings = data.securityFindings.filter(f => f.severity === 'CRITICAL');
  const highFindings = data.securityFindings.filter(f => f.severity === 'HIGH');
  const medFindings = data.securityFindings.filter(f => f.severity === 'MEDIUM');

  // Provider bar color
  const barColor = data.color;

  // Show key config props in node body
  const previewProps = getPreviewProps(data, isBeginner);

  return (
    <div className={`resource-node${selected ? ' selected' : ''}`} data-provider={data.provider}>
      {/* Provider color bar */}
      <div className="resource-node-provider-bar" style={{ background: barColor }} />

      {/* Handles — all 4 sides */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Right} id="right" />

      {/* Header */}
      <div className="resource-node-header">
        <div
          className="resource-node-icon"
          style={{ background: `${barColor}20`, border: `1px solid ${barColor}40` }}
        >
          {data.icon}
        </div>
        <div className="resource-node-names">
          <div className="resource-node-display-name">
            {isBeginner ? data.friendlyName : data.displayName}
          </div>
          {!isBeginner && (
            <div className="resource-node-type">
              {data.resourceType}
            </div>
          )}
        </div>
        <div className={`resource-node-score ${scoreClass}`} title={`Security score: ${score}/100`}>
          {score}
        </div>
      </div>

      {/* Body — key props */}
      {previewProps.length > 0 && (
        <div className="resource-node-body">
          {previewProps.map(([k, v]) => (
            <div key={k} className="resource-node-prop">
              <span className="resource-node-prop-key">{k}</span>
              <span className="resource-node-prop-value" title={String(v)}>{String(v)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Security findings badges */}
      {data.securityFindings.length > 0 && (
        <div className="resource-node-findings">
          {criticalFindings.length > 0 && (
            <span className="finding-badge CRITICAL" title={criticalFindings[0]?.message}>
              {criticalFindings.length} CRIT
            </span>
          )}
          {highFindings.length > 0 && (
            <span className="finding-badge HIGH" title={highFindings[0]?.message}>
              {highFindings.length} HIGH
            </span>
          )}
          {medFindings.length > 0 && (
            <span className="finding-badge MEDIUM" title={medFindings[0]?.message}>
              {medFindings.length} MED
            </span>
          )}
        </div>
      )}
    </div>
  );
});

ResourceNode.displayName = 'ResourceNode';

function getPreviewProps(data: TBNodeData, isBeginner: boolean): [string, unknown][] {
  const { config, resourceType } = data;

  // Resource-specific preview properties
  const previewMap: Record<string, string[]> = {
    aws_instance:              ['instance_type'],
    aws_s3_bucket:             ['versioning_enabled'],
    aws_db_instance:           ['engine', 'instance_class'],
    aws_lambda_function:       ['runtime', 'memory_size'],
    aws_dynamodb_table:        ['billing_mode'],
    aws_alb:                   ['internal'],
    aws_vpc:                   ['cidr_block'],
    aws_subnet:                ['cidr_block'],
    aws_security_group:        ['ingress_from_port'],
    aws_ecs_cluster:           ['containerInsights'],
    aws_cloudfront_distribution: ['price_class'],
    azurerm_linux_virtual_machine: ['size'],
    azurerm_storage_account:   ['account_replication_type'],
    azurerm_sql_database:      ['sku_name'],
    azurerm_linux_web_app:     ['https_only'],
    azurerm_kubernetes_cluster: ['node_count'],
    google_compute_instance:   ['machine_type'],
    google_storage_bucket:     ['location'],
    google_sql_database_instance: ['database_version', 'tier'],
    google_cloud_run_v2_service:  ['container_image'],
    google_container_cluster:  ['initial_node_count'],
  };

  const keys = previewMap[resourceType] ?? [];
  return keys
    .map(k => [formatKey(k, isBeginner), config[k]] as [string, unknown])
    .filter(([, v]) => v !== undefined && v !== null && v !== '');
}

function formatKey(key: string, isBeginner: boolean): string {
  const friendlyLabels: Record<string, string> = {
    instance_type: 'size',
    versioning_enabled: 'versioning',
    billing_mode: 'billing',
    account_replication_type: 'replication',
    container_image: 'image',
    database_version: 'engine',
    machine_type: 'machine',
    initial_node_count: 'nodes',
    node_count: 'nodes',
    ingress_from_port: 'port',
    containerInsights: 'insights',
    price_class: 'coverage',
  };
  if (isBeginner) return friendlyLabels[key] ?? key;
  return key.replace(/_/g, ' ');
}
