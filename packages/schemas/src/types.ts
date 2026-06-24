import type { Provider } from '@terrabuilder/engine';

// ─── Schema Type Definitions ──────────────────────────────────────────────────

export type PropertyType =
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

export type ResourceCategory =
  | 'Compute'
  | 'Storage'
  | 'Database'
  | 'Network'
  | 'Security'
  | 'IAM'
  | 'Serverless'
  | 'CDN & DNS'
  | 'Messaging'
  | 'Monitoring'
  | 'Container'
  | 'AI & ML'
  | 'Analytics';

export interface PropertyOption {
  label: string;
  value: string;
}

export interface PropertySchema {
  key: string;
  label: string;
  friendlyLabel: string;     // beginner-mode label
  type: PropertyType;
  required: boolean;
  default?: unknown;
  options?: PropertyOption[];
  placeholder?: string;
  description?: string;
  sensitiveValue?: boolean;  // passwords, secrets
  showInBeginner?: boolean;  // only show in beginner mode?
  minValue?: number;
  maxValue?: number;
  hclBlock?: boolean;        // is this a nested HCL block?
  hclBlockKey?: string;      // override HCL attribute key
}

export interface ConnectionRule {
  targetResourceType: string;  // what resource type can this connect TO
  relationship: string;        // the property key on target
  maxConnections?: number;     // default unlimited
  required?: boolean;
}

export interface ResourceSchema {
  provider: Provider;
  resourceType: string;        // Terraform resource type e.g. "aws_instance"
  cfnType?: string;            // CloudFormation type e.g. "AWS::EC2::Instance"
  bicepType?: string;          // Azure Bicep type
  bicepApiVersion?: string;    // Azure API version
  displayName: string;         // Full name e.g. "EC2 Instance"
  friendlyName: string;        // Beginner name e.g. "Server"
  description: string;
  icon: string;                // Emoji icon
  color: string;               // Node accent color (hex)
  bgColor: string;             // Node background tint
  category: ResourceCategory;
  tags: string[];              // searchable tags
  properties: PropertySchema[];
  secureDefaults: Record<string, unknown>;  // default secure values
  canConnectTo: ConnectionRule[];           // what this resource can connect to
  canReceiveFrom: string[];                 // what resource types can connect to this
  showInBeginner: boolean;     // appears in beginner palette
  showInIntermediate: boolean; // appears in intermediate palette
  minWidth?: number;           // canvas node min width
}
