import type { ResourceSchema } from '../types.js';

// ─── Azure Resource Schemas ───────────────────────────────────────────────────
// 15 Azure resources for Phase 1

const AZURE_BLUE = '#0078d4';
const AZURE_BG = 'rgba(0,120,212,0.08)';

export const azureSchemas: ResourceSchema[] = [
  // ─── Virtual Machine ───────────────────────────────────────────────────
  {
    provider: 'azure',
    resourceType: 'azurerm_linux_virtual_machine',
    bicepType: 'Microsoft.Compute/virtualMachines',
    bicepApiVersion: '2023-09-01',
    displayName: 'Linux Virtual Machine',
    friendlyName: 'Server',
    description: 'A Linux virtual machine in Azure.',
    icon: '🖥️',
    color: AZURE_BLUE,
    bgColor: AZURE_BG,
    category: 'Compute',
    tags: ['compute', 'vm', 'server', 'linux', 'virtual machine'],
    showInBeginner: true,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: ['azurerm_subnet', 'azurerm_network_security_group'],
    secureDefaults: {
      disable_password_authentication: true,
      encryption_at_host_enabled: true,
    },
    properties: [
      { key: 'name', label: 'VM Name', friendlyLabel: 'Server Name', type: 'string', required: true, placeholder: 'my-vm', showInBeginner: true },
      { key: 'location', label: 'Location', friendlyLabel: 'Azure Region', type: 'select', required: true, default: 'eastus', showInBeginner: true, options: [
        { label: 'East US', value: 'eastus' },
        { label: 'West US 2', value: 'westus2' },
        { label: 'West Europe', value: 'westeurope' },
        { label: 'North Europe', value: 'northeurope' },
        { label: 'Southeast Asia', value: 'southeastasia' },
        { label: 'Australia East', value: 'australiaeast' },
        { label: 'UK South', value: 'uksouth' },
      ]},
      { key: 'size', label: 'VM Size', friendlyLabel: 'Server Size', type: 'select', required: true, default: 'Standard_B1s', showInBeginner: true, options: [
        { label: 'Standard_B1s (1 vCPU, 1GB) — Dev', value: 'Standard_B1s' },
        { label: 'Standard_B2s (2 vCPU, 4GB)', value: 'Standard_B2s' },
        { label: 'Standard_D2s_v3 (2 vCPU, 8GB)', value: 'Standard_D2s_v3' },
        { label: 'Standard_D4s_v3 (4 vCPU, 16GB)', value: 'Standard_D4s_v3' },
        { label: 'Standard_E4s_v3 (4 vCPU, 32GB)', value: 'Standard_E4s_v3' },
      ]},
      { key: 'admin_username', label: 'Admin Username', friendlyLabel: 'Admin Username', type: 'string', required: true, default: 'azureuser', showInBeginner: true },
      { key: 'disable_password_authentication', label: 'SSH Key Only', friendlyLabel: 'Require SSH Key Login', type: 'boolean', required: false, default: true },
    ],
  },

  // ─── Virtual Network ───────────────────────────────────────────────────
  {
    provider: 'azure',
    resourceType: 'azurerm_virtual_network',
    bicepType: 'Microsoft.Network/virtualNetworks',
    bicepApiVersion: '2023-09-01',
    displayName: 'Virtual Network',
    friendlyName: 'Private Network',
    description: 'Azure Virtual Network — an isolated private network for resources.',
    icon: '🌐',
    color: '#9c27b0',
    bgColor: 'rgba(156,39,176,0.08)',
    category: 'Network',
    tags: ['network', 'vnet', 'virtual network', 'azure networking'],
    showInBeginner: true,
    showInIntermediate: true,
    canConnectTo: [
      { targetResourceType: 'azurerm_subnet', relationship: 'virtual_network_name' },
    ],
    canReceiveFrom: [],
    secureDefaults: {},
    properties: [
      { key: 'name', label: 'VNet Name', friendlyLabel: 'Network Name', type: 'string', required: true, placeholder: 'my-vnet', showInBeginner: true },
      { key: 'location', label: 'Location', friendlyLabel: 'Azure Region', type: 'select', required: true, default: 'eastus', options: [
        { label: 'East US', value: 'eastus' },
        { label: 'West Europe', value: 'westeurope' },
        { label: 'UK South', value: 'uksouth' },
      ]},
      { key: 'address_space', label: 'Address Space', friendlyLabel: 'Network Range', type: 'cidr', required: true, default: '10.0.0.0/16', showInBeginner: true },
    ],
  },

  // ─── Subnet (Azure) ────────────────────────────────────────────────────
  {
    provider: 'azure',
    resourceType: 'azurerm_subnet',
    bicepType: 'Microsoft.Network/virtualNetworks/subnets',
    bicepApiVersion: '2023-09-01',
    displayName: 'Subnet',
    friendlyName: 'Sub-Network',
    description: 'A segment within your Virtual Network.',
    icon: '🔲',
    color: '#607d8b',
    bgColor: 'rgba(96,125,139,0.08)',
    category: 'Network',
    tags: ['subnet', 'network', 'azure', 'segmentation'],
    showInBeginner: false,
    showInIntermediate: true,
    canConnectTo: [
      { targetResourceType: 'azurerm_linux_virtual_machine', relationship: 'subnet_id' },
    ],
    canReceiveFrom: ['azurerm_virtual_network'],
    secureDefaults: {},
    properties: [
      { key: 'name', label: 'Subnet Name', friendlyLabel: 'Sub-Network Name', type: 'string', required: true, placeholder: 'my-subnet' },
      { key: 'address_prefixes', label: 'Address Prefix', friendlyLabel: 'Address Range', type: 'cidr', required: true, default: '10.0.1.0/24' },
    ],
  },

  // ─── Storage Account ───────────────────────────────────────────────────
  {
    provider: 'azure',
    resourceType: 'azurerm_storage_account',
    bicepType: 'Microsoft.Storage/storageAccounts',
    bicepApiVersion: '2023-01-01',
    displayName: 'Storage Account',
    friendlyName: 'File Storage',
    description: 'Scalable cloud storage for blobs, files, queues, and tables.',
    icon: '🪣',
    color: AZURE_BLUE,
    bgColor: AZURE_BG,
    category: 'Storage',
    tags: ['storage', 'blob', 'files', 'azure storage'],
    showInBeginner: true,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: [],
    secureDefaults: {
      account_replication_type: 'LRS',
      min_tls_version: 'TLS1_2',
      enable_https_traffic_only: true,
      allow_nested_items_to_be_public: false,
    },
    properties: [
      { key: 'name', label: 'Storage Account Name', friendlyLabel: 'Storage Name', type: 'string', required: true, placeholder: 'mystorageaccount', showInBeginner: true },
      { key: 'location', label: 'Location', friendlyLabel: 'Region', type: 'select', required: true, default: 'eastus' , options: [
        { label: 'East US', value: 'eastus' }, { label: 'West Europe', value: 'westeurope' }, { label: 'UK South', value: 'uksouth' },
      ]},
      { key: 'account_tier', label: 'Performance Tier', friendlyLabel: 'Performance Level', type: 'select', required: true, default: 'Standard', options: [
        { label: 'Standard', value: 'Standard' },
        { label: 'Premium', value: 'Premium' },
      ]},
      { key: 'account_replication_type', label: 'Replication', friendlyLabel: 'Data Redundancy', type: 'select', required: true, default: 'LRS', options: [
        { label: 'LRS (Local, 3 copies)', value: 'LRS' },
        { label: 'ZRS (Zone-redundant)', value: 'ZRS' },
        { label: 'GRS (Geo-redundant)', value: 'GRS' },
        { label: 'RAGRS (Read-access geo)', value: 'RAGRS' },
      ]},
      { key: 'min_tls_version', label: 'Minimum TLS', friendlyLabel: 'Minimum TLS Version', type: 'select', required: false, default: 'TLS1_2', options: [
        { label: 'TLS 1.2 (Recommended)', value: 'TLS1_2' },
        { label: 'TLS 1.1', value: 'TLS1_1' },
      ]},
      { key: 'allow_nested_items_to_be_public', label: 'Public Access', friendlyLabel: 'Allow Public Access to Files', type: 'boolean', required: false, default: false },
    ],
  },

  // ─── SQL Database ──────────────────────────────────────────────────────
  {
    provider: 'azure',
    resourceType: 'azurerm_sql_database',
    bicepType: 'Microsoft.Sql/servers/databases',
    bicepApiVersion: '2023-02-01-preview',
    displayName: 'Azure SQL Database',
    friendlyName: 'Database',
    description: 'Managed SQL database with built-in intelligence and security.',
    icon: '🗄️',
    color: '#ff9800',
    bgColor: 'rgba(255,152,0,0.08)',
    category: 'Database',
    tags: ['database', 'sql', 'azure sql', 'relational'],
    showInBeginner: true,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: ['azurerm_subnet'],
    secureDefaults: {
      zone_redundant: true,
      transparent_data_encryption_enabled: true,
    },
    properties: [
      { key: 'name', label: 'Database Name', friendlyLabel: 'Database Name', type: 'string', required: true, placeholder: 'mydb', showInBeginner: true },
      { key: 'sku_name', label: 'SKU', friendlyLabel: 'Database Size', type: 'select', required: true, default: 'S0', options: [
        { label: 'Free (32MB)', value: 'Free' },
        { label: 'Basic (5 DTUs, 2GB)', value: 'Basic' },
        { label: 'S0 (10 DTUs, 250GB)', value: 'S0' },
        { label: 'S2 (50 DTUs)', value: 'S2' },
        { label: 'P1 (125 DTUs, Premium)', value: 'P1' },
        { label: 'GP_Gen5_2 (General Purpose)', value: 'GP_Gen5_2' },
      ]},
      { key: 'zone_redundant', label: 'Zone Redundant', friendlyLabel: 'High Availability', type: 'boolean', required: false, default: true },
      { key: 'transparent_data_encryption_enabled', label: 'TDE Encryption', friendlyLabel: 'Encrypt Data', type: 'boolean', required: false, default: true },
    ],
  },

  // ─── App Service ───────────────────────────────────────────────────────
  {
    provider: 'azure',
    resourceType: 'azurerm_linux_web_app',
    bicepType: 'Microsoft.Web/sites',
    bicepApiVersion: '2023-01-01',
    displayName: 'App Service (Web App)',
    friendlyName: 'Web App',
    description: 'Run web apps, APIs, and backends without managing servers.',
    icon: '🌐',
    color: AZURE_BLUE,
    bgColor: AZURE_BG,
    category: 'Compute',
    tags: ['web app', 'app service', 'paas', 'hosting', 'azure'],
    showInBeginner: true,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: ['azurerm_subnet'],
    secureDefaults: {
      https_only: true,
      minimum_tls_version: '1.2',
    },
    properties: [
      { key: 'name', label: 'App Name', friendlyLabel: 'Web App Name', type: 'string', required: true, placeholder: 'my-web-app', showInBeginner: true },
      { key: 'location', label: 'Location', friendlyLabel: 'Region', type: 'select', required: true, default: 'eastus', options: [
        { label: 'East US', value: 'eastus' }, { label: 'West Europe', value: 'westeurope' }, { label: 'UK South', value: 'uksouth' },
      ]},
      { key: 'os_type', label: 'OS Type', friendlyLabel: 'Operating System', type: 'select', required: true, default: 'Linux', options: [
        { label: 'Linux (Recommended)', value: 'Linux' },
        { label: 'Windows', value: 'Windows' },
      ]},
      { key: 'https_only', label: 'HTTPS Only', friendlyLabel: 'Force HTTPS', type: 'boolean', required: false, default: true },
    ],
  },

  // ─── Function App ──────────────────────────────────────────────────────
  {
    provider: 'azure',
    resourceType: 'azurerm_linux_function_app',
    bicepType: 'Microsoft.Web/sites',
    bicepApiVersion: '2023-01-01',
    displayName: 'Function App',
    friendlyName: 'Serverless Function',
    description: 'Run event-driven code without managing infrastructure.',
    icon: '⚡',
    color: '#ff9800',
    bgColor: 'rgba(255,152,0,0.08)',
    category: 'Serverless',
    tags: ['serverless', 'function', 'faas', 'azure functions'],
    showInBeginner: true,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: ['azurerm_storage_account'],
    secureDefaults: {
      https_only: true,
    },
    properties: [
      { key: 'name', label: 'Function App Name', friendlyLabel: 'Function Name', type: 'string', required: true, placeholder: 'my-function-app', showInBeginner: true },
      { key: 'location', label: 'Location', friendlyLabel: 'Region', type: 'select', required: true, default: 'eastus', options: [
        { label: 'East US', value: 'eastus' }, { label: 'West Europe', value: 'westeurope' },
      ]},
      { key: 'https_only', label: 'HTTPS Only', friendlyLabel: 'Force HTTPS', type: 'boolean', required: false, default: true },
    ],
  },

  // ─── Key Vault ─────────────────────────────────────────────────────────
  {
    provider: 'azure',
    resourceType: 'azurerm_key_vault',
    bicepType: 'Microsoft.KeyVault/vaults',
    bicepApiVersion: '2023-02-01',
    displayName: 'Key Vault',
    friendlyName: 'Secret Store',
    description: 'Securely store secrets, keys, and certificates.',
    icon: '🔐',
    color: '#9c27b0',
    bgColor: 'rgba(156,39,176,0.08)',
    category: 'Security',
    tags: ['key vault', 'secrets', 'security', 'certificates'],
    showInBeginner: false,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: [],
    secureDefaults: {
      soft_delete_retention_days: 90,
      purge_protection_enabled: true,
      sku_name: 'standard',
    },
    properties: [
      { key: 'name', label: 'Vault Name', friendlyLabel: 'Vault Name', type: 'string', required: true, placeholder: 'my-key-vault' },
      { key: 'location', label: 'Location', friendlyLabel: 'Region', type: 'select', required: true, default: 'eastus', options: [
        { label: 'East US', value: 'eastus' }, { label: 'West Europe', value: 'westeurope' },
      ]},
      { key: 'sku_name', label: 'SKU', friendlyLabel: 'Service Tier', type: 'select', required: true, default: 'standard', options: [
        { label: 'Standard', value: 'standard' },
        { label: 'Premium (HSM)', value: 'premium' },
      ]},
      { key: 'soft_delete_retention_days', label: 'Soft Delete Retention (days)', friendlyLabel: 'Recovery Window (days)', type: 'number', required: false, default: 90, minValue: 7, maxValue: 90 },
      { key: 'purge_protection_enabled', label: 'Purge Protection', friendlyLabel: 'Prevent Permanent Deletion', type: 'boolean', required: false, default: true },
    ],
  },

  // ─── AKS Cluster ───────────────────────────────────────────────────────
  {
    provider: 'azure',
    resourceType: 'azurerm_kubernetes_cluster',
    bicepType: 'Microsoft.ContainerService/managedClusters',
    bicepApiVersion: '2023-10-01',
    displayName: 'AKS Cluster',
    friendlyName: 'Kubernetes Cluster',
    description: 'Managed Kubernetes cluster for container workloads.',
    icon: '☸️',
    color: AZURE_BLUE,
    bgColor: AZURE_BG,
    category: 'Container',
    tags: ['kubernetes', 'aks', 'containers', 'orchestration'],
    showInBeginner: false,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: ['azurerm_subnet'],
    secureDefaults: {
      role_based_access_control_enabled: true,
    },
    properties: [
      { key: 'name', label: 'Cluster Name', friendlyLabel: 'Cluster Name', type: 'string', required: true, placeholder: 'my-aks-cluster' },
      { key: 'location', label: 'Location', friendlyLabel: 'Region', type: 'select', required: true, default: 'eastus', options: [
        { label: 'East US', value: 'eastus' }, { label: 'West Europe', value: 'westeurope' },
      ]},
      { key: 'kubernetes_version', label: 'Kubernetes Version', friendlyLabel: 'K8s Version', type: 'string', required: false, default: '1.29' },
      { key: 'node_count', label: 'Node Count', friendlyLabel: 'Number of Nodes', type: 'number', required: true, default: 3, minValue: 1, maxValue: 100 },
      { key: 'vm_size', label: 'Node VM Size', friendlyLabel: 'Node Size', type: 'select', required: true, default: 'Standard_DS2_v2', options: [
        { label: 'Standard_DS2_v2 (2 vCPU, 7GB)', value: 'Standard_DS2_v2' },
        { label: 'Standard_DS3_v2 (4 vCPU, 14GB)', value: 'Standard_DS3_v2' },
        { label: 'Standard_D8s_v3 (8 vCPU, 32GB)', value: 'Standard_D8s_v3' },
      ]},
    ],
  },

  // ─── Application Gateway ───────────────────────────────────────────────
  {
    provider: 'azure',
    resourceType: 'azurerm_application_gateway',
    bicepType: 'Microsoft.Network/applicationGateways',
    bicepApiVersion: '2023-09-01',
    displayName: 'Application Gateway',
    friendlyName: 'Load Balancer',
    description: 'Layer 7 load balancer with WAF, SSL termination, and URL routing.',
    icon: '⚖️',
    color: AZURE_BLUE,
    bgColor: AZURE_BG,
    category: 'Network',
    tags: ['load balancer', 'application gateway', 'waf', 'network'],
    showInBeginner: false,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: ['azurerm_subnet'],
    secureDefaults: {
      waf_enabled: true,
      waf_mode: 'Prevention',
    },
    properties: [
      { key: 'name', label: 'Gateway Name', friendlyLabel: 'Load Balancer Name', type: 'string', required: true, placeholder: 'my-app-gateway' },
      { key: 'location', label: 'Location', friendlyLabel: 'Region', type: 'select', required: true, default: 'eastus', options: [
        { label: 'East US', value: 'eastus' }, { label: 'West Europe', value: 'westeurope' },
      ]},
      { key: 'sku_tier', label: 'SKU Tier', friendlyLabel: 'Tier', type: 'select', required: true, default: 'WAF_v2', options: [
        { label: 'Standard V2', value: 'Standard_v2' },
        { label: 'WAF V2 (Recommended)', value: 'WAF_v2' },
      ]},
    ],
  },

  // ─── CosmosDB ──────────────────────────────────────────────────────────
  {
    provider: 'azure',
    resourceType: 'azurerm_cosmosdb_account',
    bicepType: 'Microsoft.DocumentDB/databaseAccounts',
    bicepApiVersion: '2023-04-15',
    displayName: 'Cosmos DB',
    friendlyName: 'Global NoSQL Database',
    description: 'Globally distributed NoSQL database with multi-model support.',
    icon: '🌍',
    color: '#1976d2',
    bgColor: 'rgba(25,118,210,0.08)',
    category: 'Database',
    tags: ['cosmosdb', 'nosql', 'global', 'database', 'distributed'],
    showInBeginner: false,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: [],
    secureDefaults: {
      enable_automatic_failover: true,
      is_virtual_network_filter_enabled: false,
    },
    properties: [
      { key: 'name', label: 'Account Name', friendlyLabel: 'Database Name', type: 'string', required: true, placeholder: 'my-cosmos-db' },
      { key: 'location', label: 'Location', friendlyLabel: 'Primary Region', type: 'select', required: true, default: 'eastus', options: [
        { label: 'East US', value: 'eastus' }, { label: 'West Europe', value: 'westeurope' },
      ]},
      { key: 'offer_type', label: 'Offer Type', friendlyLabel: 'Offer Type', type: 'select', required: true, default: 'Standard', options: [{ label: 'Standard', value: 'Standard' }] },
      { key: 'kind', label: 'API Kind', friendlyLabel: 'API Type', type: 'select', required: true, default: 'GlobalDocumentDB', options: [
        { label: 'NoSQL (Core SQL API)', value: 'GlobalDocumentDB' },
        { label: 'MongoDB API', value: 'MongoDB' },
        { label: 'Table API', value: 'AzureTable' },
      ]},
      { key: 'enable_automatic_failover', label: 'Automatic Failover', friendlyLabel: 'Auto-Failover', type: 'boolean', required: false, default: true },
    ],
  },

  // ─── Network Security Group ─────────────────────────────────────────────
  {
    provider: 'azure',
    resourceType: 'azurerm_network_security_group',
    bicepType: 'Microsoft.Network/networkSecurityGroups',
    bicepApiVersion: '2023-09-01',
    displayName: 'Network Security Group',
    friendlyName: 'Firewall',
    description: 'Azure firewall rules for controlling network traffic.',
    icon: '🛡️',
    color: '#f44336',
    bgColor: 'rgba(244,67,54,0.08)',
    category: 'Security',
    tags: ['nsg', 'firewall', 'network', 'security group', 'azure'],
    showInBeginner: true,
    showInIntermediate: true,
    canConnectTo: [
      { targetResourceType: 'azurerm_linux_virtual_machine', relationship: 'network_security_group_id' },
    ],
    canReceiveFrom: [],
    secureDefaults: {},
    properties: [
      { key: 'name', label: 'NSG Name', friendlyLabel: 'Firewall Name', type: 'string', required: true, placeholder: 'my-nsg', showInBeginner: true },
      { key: 'location', label: 'Location', friendlyLabel: 'Region', type: 'select', required: true, default: 'eastus', options: [
        { label: 'East US', value: 'eastus' }, { label: 'West Europe', value: 'westeurope' },
      ]},
    ],
  },

  // ─── Azure Monitor Alert ───────────────────────────────────────────────
  {
    provider: 'azure',
    resourceType: 'azurerm_monitor_metric_alert',
    bicepType: 'Microsoft.Insights/metricAlerts',
    bicepApiVersion: '2018-03-01',
    displayName: 'Monitor Alert',
    friendlyName: 'Alert',
    description: 'Monitor Azure resources and send alerts on metric thresholds.',
    icon: '🔔',
    color: '#f44336',
    bgColor: 'rgba(244,67,54,0.08)',
    category: 'Monitoring',
    tags: ['monitoring', 'alert', 'metrics', 'azure monitor'],
    showInBeginner: false,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: [],
    secureDefaults: {},
    properties: [
      { key: 'name', label: 'Alert Name', friendlyLabel: 'Alert Name', type: 'string', required: true, placeholder: 'high-cpu-alert' },
      { key: 'description', label: 'Description', friendlyLabel: 'Alert Description', type: 'string', required: false },
      { key: 'severity', label: 'Severity (0-4)', friendlyLabel: 'Severity Level', type: 'number', required: true, default: 2, minValue: 0, maxValue: 4 },
      { key: 'enabled', label: 'Enabled', friendlyLabel: 'Active', type: 'boolean', required: false, default: true },
    ],
  },

  // ─── Event Hub ─────────────────────────────────────────────────────────
  {
    provider: 'azure',
    resourceType: 'azurerm_eventhub_namespace',
    bicepType: 'Microsoft.EventHub/namespaces',
    bicepApiVersion: '2023-01-01-preview',
    displayName: 'Event Hub',
    friendlyName: 'Event Streaming',
    description: 'Real-time event streaming for millions of events per second.',
    icon: '🌊',
    color: '#1976d2',
    bgColor: 'rgba(25,118,210,0.08)',
    category: 'Messaging',
    tags: ['event hub', 'streaming', 'kafka', 'real-time', 'messaging'],
    showInBeginner: false,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: [],
    secureDefaults: {
      sku: 'Standard',
    },
    properties: [
      { key: 'name', label: 'Namespace Name', friendlyLabel: 'Event Hub Name', type: 'string', required: true, placeholder: 'my-eventhub' },
      { key: 'location', label: 'Location', friendlyLabel: 'Region', type: 'select', required: true, default: 'eastus', options: [
        { label: 'East US', value: 'eastus' }, { label: 'West Europe', value: 'westeurope' },
      ]},
      { key: 'sku', label: 'SKU', friendlyLabel: 'Pricing Tier', type: 'select', required: true, default: 'Standard', options: [
        { label: 'Basic', value: 'Basic' },
        { label: 'Standard (Recommended)', value: 'Standard' },
        { label: 'Premium', value: 'Premium' },
      ]},
      { key: 'capacity', label: 'Throughput Units', friendlyLabel: 'Throughput Units', type: 'number', required: false, default: 1, minValue: 1, maxValue: 40 },
    ],
  },
];
