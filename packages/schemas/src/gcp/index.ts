import type { ResourceSchema } from '../types.js';

// ─── GCP Resource Schemas ─────────────────────────────────────────────────────
// 15 GCP resources for Phase 1

const GCP_BLUE = '#4285f4';
const GCP_BG = 'rgba(66,133,244,0.08)';

export const gcpSchemas: ResourceSchema[] = [
  // ─── Compute Instance ──────────────────────────────────────────────────
  {
    provider: 'gcp',
    resourceType: 'google_compute_instance',
    displayName: 'Compute Instance',
    friendlyName: 'Server',
    description: 'A virtual machine running on Google Cloud infrastructure.',
    icon: '🖥️',
    color: GCP_BLUE,
    bgColor: GCP_BG,
    category: 'Compute',
    tags: ['compute', 'vm', 'server', 'gce', 'virtual machine'],
    showInBeginner: true,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: ['google_compute_subnetwork', 'google_compute_firewall'],
    secureDefaults: {
      shielded_instance_config_enable_secure_boot: true,
      shielded_instance_config_enable_vtpm: true,
      shielded_instance_config_enable_integrity_monitoring: true,
      metadata_enable_oslogin: true,
    },
    properties: [
      { key: 'name', label: 'Instance Name', friendlyLabel: 'Server Name', type: 'string', required: true, placeholder: 'my-instance', showInBeginner: true },
      { key: 'machine_type', label: 'Machine Type', friendlyLabel: 'Server Size', type: 'select', required: true, default: 'e2-micro', showInBeginner: true, options: [
        { label: 'e2-micro (2 vCPU, 1GB) — Free Tier', value: 'e2-micro' },
        { label: 'e2-small (2 vCPU, 2GB)', value: 'e2-small' },
        { label: 'e2-medium (2 vCPU, 4GB)', value: 'e2-medium' },
        { label: 'n1-standard-2 (2 vCPU, 7.5GB)', value: 'n1-standard-2' },
        { label: 'n1-standard-4 (4 vCPU, 15GB)', value: 'n1-standard-4' },
        { label: 'n2-standard-4 (4 vCPU, 16GB)', value: 'n2-standard-4' },
      ]},
      { key: 'zone', label: 'Zone', friendlyLabel: 'Location', type: 'select', required: true, default: 'us-central1-a', options: [
        { label: 'US Central 1a', value: 'us-central1-a' },
        { label: 'US East 1b', value: 'us-east1-b' },
        { label: 'Europe West 1b', value: 'europe-west1-b' },
        { label: 'Asia Southeast 1a', value: 'asia-southeast1-a' },
      ]},
      { key: 'boot_disk_image', label: 'Boot Disk Image', friendlyLabel: 'Operating System', type: 'select', required: false, default: 'debian-cloud/debian-12', options: [
        { label: 'Debian 12', value: 'debian-cloud/debian-12' },
        { label: 'Ubuntu 22.04 LTS', value: 'ubuntu-os-cloud/ubuntu-2204-lts' },
        { label: 'CentOS 7', value: 'centos-cloud/centos-7' },
        { label: 'Rocky Linux 9', value: 'rocky-linux-cloud/rocky-linux-9' },
      ]},
      { key: 'metadata_enable_oslogin', label: 'OS Login', friendlyLabel: 'Use Google IAM for SSH', type: 'boolean', required: false, default: true },
    ],
  },

  // ─── GCS Bucket ────────────────────────────────────────────────────────
  {
    provider: 'gcp',
    resourceType: 'google_storage_bucket',
    displayName: 'Cloud Storage Bucket',
    friendlyName: 'File Storage',
    description: 'Object storage for files, backups, and static assets.',
    icon: '🪣',
    color: '#34a853',
    bgColor: 'rgba(52,168,83,0.08)',
    category: 'Storage',
    tags: ['storage', 'gcs', 'bucket', 'object storage', 'files'],
    showInBeginner: true,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: ['google_compute_instance'],
    secureDefaults: {
      public_access_prevention: 'enforced',
      uniform_bucket_level_access: true,
      versioning_enabled: true,
    },
    properties: [
      { key: 'name', label: 'Bucket Name', friendlyLabel: 'Storage Name', type: 'string', required: true, placeholder: 'my-unique-bucket', showInBeginner: true },
      { key: 'location', label: 'Location', friendlyLabel: 'Storage Region', type: 'select', required: true, default: 'US', options: [
        { label: 'United States (Multi-Region)', value: 'US' },
        { label: 'Europe (Multi-Region)', value: 'EU' },
        { label: 'Asia (Multi-Region)', value: 'ASIA' },
        { label: 'us-central1', value: 'us-central1' },
        { label: 'europe-west1', value: 'europe-west1' },
      ]},
      { key: 'storage_class', label: 'Storage Class', friendlyLabel: 'Storage Type', type: 'select', required: false, default: 'STANDARD', options: [
        { label: 'Standard (Frequently accessed)', value: 'STANDARD' },
        { label: 'Nearline (Monthly access)', value: 'NEARLINE' },
        { label: 'Coldline (Quarterly access)', value: 'COLDLINE' },
        { label: 'Archive (Yearly access)', value: 'ARCHIVE' },
      ]},
      { key: 'public_access_prevention', label: 'Public Access Prevention', friendlyLabel: 'Block Public Access', type: 'select', required: false, default: 'enforced', options: [
        { label: 'Enforced (Block all public access)', value: 'enforced' },
        { label: 'Inherited (Use IAM)', value: 'inherited' },
      ]},
      { key: 'uniform_bucket_level_access', label: 'Uniform Access', friendlyLabel: 'Uniform Bucket Access (Recommended)', type: 'boolean', required: false, default: true },
      { key: 'versioning_enabled', label: 'Versioning', friendlyLabel: 'Keep Old File Versions', type: 'boolean', required: false, default: true },
    ],
  },

  // ─── Cloud SQL ─────────────────────────────────────────────────────────
  {
    provider: 'gcp',
    resourceType: 'google_sql_database_instance',
    displayName: 'Cloud SQL',
    friendlyName: 'Database',
    description: 'Managed relational database — PostgreSQL, MySQL, or SQL Server.',
    icon: '🗄️',
    color: '#fbbc04',
    bgColor: 'rgba(251,188,4,0.08)',
    category: 'Database',
    tags: ['database', 'cloud sql', 'postgresql', 'mysql', 'sql'],
    showInBeginner: true,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: ['google_compute_subnetwork'],
    secureDefaults: {
      deletion_protection: true,
      backup_enabled: true,
      ip_configuration_require_ssl: true,
      ip_configuration_ipv4_enabled: false,
    },
    properties: [
      { key: 'name', label: 'Instance Name', friendlyLabel: 'Database Name', type: 'string', required: true, placeholder: 'my-sql-instance', showInBeginner: true },
      { key: 'database_version', label: 'Database Version', friendlyLabel: 'Database Type', type: 'select', required: true, default: 'POSTGRES_15', showInBeginner: true, options: [
        { label: 'PostgreSQL 15', value: 'POSTGRES_15' },
        { label: 'PostgreSQL 14', value: 'POSTGRES_14' },
        { label: 'MySQL 8.0', value: 'MYSQL_8_0' },
        { label: 'SQL Server 2019', value: 'SQLSERVER_2019_STANDARD' },
      ]},
      { key: 'tier', label: 'Machine Tier', friendlyLabel: 'Database Size', type: 'select', required: true, default: 'db-f1-micro', showInBeginner: true, options: [
        { label: 'db-f1-micro (Shared, Free Tier)', value: 'db-f1-micro' },
        { label: 'db-g1-small (Shared)', value: 'db-g1-small' },
        { label: 'db-n1-standard-1 (1 vCPU, 3.75GB)', value: 'db-n1-standard-1' },
        { label: 'db-n1-standard-2 (2 vCPU, 7.5GB)', value: 'db-n1-standard-2' },
        { label: 'db-n1-highmem-4 (4 vCPU, 26GB)', value: 'db-n1-highmem-4' },
      ]},
      { key: 'region', label: 'Region', friendlyLabel: 'Region', type: 'select', required: false, default: 'us-central1', options: [
        { label: 'US Central 1', value: 'us-central1' },
        { label: 'US East 1', value: 'us-east1' },
        { label: 'Europe West 1', value: 'europe-west1' },
      ]},
      { key: 'ip_configuration_require_ssl', label: 'Require SSL', friendlyLabel: 'Require Encrypted Connection', type: 'boolean', required: false, default: true },
      { key: 'ip_configuration_ipv4_enabled', label: 'Public IP', friendlyLabel: 'Allow Public Access', type: 'boolean', required: false, default: false },
      { key: 'deletion_protection', label: 'Deletion Protection', friendlyLabel: 'Protect from Deletion', type: 'boolean', required: false, default: true },
      { key: 'backup_enabled', label: 'Backups', friendlyLabel: 'Enable Automated Backups', type: 'boolean', required: false, default: true },
    ],
  },

  // ─── VPC Network ───────────────────────────────────────────────────────
  {
    provider: 'gcp',
    resourceType: 'google_compute_network',
    displayName: 'VPC Network',
    friendlyName: 'Private Network',
    description: 'Global virtual network for Google Cloud resources.',
    icon: '🌐',
    color: '#9c27b0',
    bgColor: 'rgba(156,39,176,0.08)',
    category: 'Network',
    tags: ['network', 'vpc', 'virtual network', 'gcp networking'],
    showInBeginner: true,
    showInIntermediate: true,
    canConnectTo: [
      { targetResourceType: 'google_compute_subnetwork', relationship: 'network' },
    ],
    canReceiveFrom: [],
    secureDefaults: {
      auto_create_subnetworks: false,
    },
    properties: [
      { key: 'name', label: 'Network Name', friendlyLabel: 'Network Name', type: 'string', required: true, placeholder: 'my-vpc', showInBeginner: true },
      { key: 'auto_create_subnetworks', label: 'Auto-create Subnets', friendlyLabel: 'Automatically Create Sub-Networks', type: 'boolean', required: false, default: false },
    ],
  },

  // ─── Subnetwork ────────────────────────────────────────────────────────
  {
    provider: 'gcp',
    resourceType: 'google_compute_subnetwork',
    displayName: 'Subnetwork',
    friendlyName: 'Sub-Network',
    description: 'A subnet within a GCP VPC network.',
    icon: '🔲',
    color: '#607d8b',
    bgColor: 'rgba(96,125,139,0.08)',
    category: 'Network',
    tags: ['subnet', 'subnetwork', 'network', 'gcp'],
    showInBeginner: false,
    showInIntermediate: true,
    canConnectTo: [
      { targetResourceType: 'google_compute_instance', relationship: 'subnetwork' },
      { targetResourceType: 'google_sql_database_instance', relationship: 'private_network' },
    ],
    canReceiveFrom: ['google_compute_network'],
    secureDefaults: {
      private_ip_google_access: true,
    },
    properties: [
      { key: 'name', label: 'Subnet Name', friendlyLabel: 'Sub-Network Name', type: 'string', required: true, placeholder: 'my-subnet' },
      { key: 'ip_cidr_range', label: 'IP CIDR Range', friendlyLabel: 'Address Range', type: 'cidr', required: true, default: '10.0.1.0/24' },
      { key: 'region', label: 'Region', friendlyLabel: 'Region', type: 'select', required: true, default: 'us-central1', options: [
        { label: 'US Central 1', value: 'us-central1' }, { label: 'Europe West 1', value: 'europe-west1' },
      ]},
      { key: 'private_ip_google_access', label: 'Private Google Access', friendlyLabel: 'Access Google APIs Privately', type: 'boolean', required: false, default: true },
    ],
  },

  // ─── GKE Cluster ───────────────────────────────────────────────────────
  {
    provider: 'gcp',
    resourceType: 'google_container_cluster',
    displayName: 'GKE Cluster',
    friendlyName: 'Kubernetes Cluster',
    description: 'Managed Kubernetes cluster. Run containers at scale.',
    icon: '☸️',
    color: GCP_BLUE,
    bgColor: GCP_BG,
    category: 'Container',
    tags: ['kubernetes', 'gke', 'container', 'cluster', 'orchestration'],
    showInBeginner: false,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: ['google_compute_subnetwork'],
    secureDefaults: {
      enable_autopilot: false,
      enable_shielded_nodes: true,
      remove_default_node_pool: true,
    },
    properties: [
      { key: 'name', label: 'Cluster Name', friendlyLabel: 'Cluster Name', type: 'string', required: true, placeholder: 'my-gke-cluster' },
      { key: 'location', label: 'Location', friendlyLabel: 'Region/Zone', type: 'select', required: true, default: 'us-central1', options: [
        { label: 'US Central 1', value: 'us-central1' }, { label: 'Europe West 1', value: 'europe-west1' },
      ]},
      { key: 'min_master_version', label: 'K8s Version', friendlyLabel: 'Kubernetes Version', type: 'string', required: false, default: 'latest' },
      { key: 'initial_node_count', label: 'Initial Node Count', friendlyLabel: 'Starting Node Count', type: 'number', required: false, default: 3, minValue: 1, maxValue: 100 },
    ],
  },

  // ─── Cloud Run ─────────────────────────────────────────────────────────
  {
    provider: 'gcp',
    resourceType: 'google_cloud_run_v2_service',
    displayName: 'Cloud Run',
    friendlyName: 'Serverless Container',
    description: 'Fully managed serverless platform for containerized applications.',
    icon: '🚀',
    color: '#34a853',
    bgColor: 'rgba(52,168,83,0.08)',
    category: 'Serverless',
    tags: ['cloud run', 'serverless', 'containers', 'paas', 'faas'],
    showInBeginner: true,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: [],
    secureDefaults: {},
    properties: [
      { key: 'name', label: 'Service Name', friendlyLabel: 'Service Name', type: 'string', required: true, placeholder: 'my-service', showInBeginner: true },
      { key: 'location', label: 'Region', friendlyLabel: 'Region', type: 'select', required: true, default: 'us-central1', options: [
        { label: 'US Central 1', value: 'us-central1' }, { label: 'Europe West 1', value: 'europe-west1' }, { label: 'Asia East 1', value: 'asia-east1' },
      ]},
      { key: 'container_image', label: 'Container Image', friendlyLabel: 'Docker Image', type: 'string', required: true, default: 'gcr.io/cloudrun/hello', placeholder: 'gcr.io/my-project/my-image' },
      { key: 'max_instance_count', label: 'Max Instances', friendlyLabel: 'Maximum Instances', type: 'number', required: false, default: 10, minValue: 1, maxValue: 1000 },
    ],
  },

  // ─── Cloud Functions ───────────────────────────────────────────────────
  {
    provider: 'gcp',
    resourceType: 'google_cloudfunctions2_function',
    displayName: 'Cloud Functions',
    friendlyName: 'Serverless Function',
    description: 'Run code triggered by events without managing servers.',
    icon: '⚡',
    color: '#fbbc04',
    bgColor: 'rgba(251,188,4,0.08)',
    category: 'Serverless',
    tags: ['serverless', 'functions', 'cloud functions', 'event-driven'],
    showInBeginner: true,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: ['google_pubsub_topic'],
    secureDefaults: {},
    properties: [
      { key: 'name', label: 'Function Name', friendlyLabel: 'Function Name', type: 'string', required: true, placeholder: 'my-function', showInBeginner: true },
      { key: 'location', label: 'Region', friendlyLabel: 'Region', type: 'select', required: true, default: 'us-central1', options: [
        { label: 'US Central 1', value: 'us-central1' }, { label: 'Europe West 1', value: 'europe-west1' },
      ]},
      { key: 'runtime', label: 'Runtime', friendlyLabel: 'Programming Language', type: 'select', required: true, default: 'nodejs20', options: [
        { label: 'Node.js 20', value: 'nodejs20' },
        { label: 'Python 3.12', value: 'python312' },
        { label: 'Go 1.22', value: 'go122' },
        { label: 'Java 21', value: 'java21' },
      ]},
      { key: 'available_memory', label: 'Memory', friendlyLabel: 'Memory', type: 'select', required: false, default: '256M', options: [
        { label: '128MB', value: '128M' }, { label: '256MB', value: '256M' }, { label: '512MB', value: '512M' }, { label: '1GB', value: '1Gi' },
      ]},
    ],
  },

  // ─── BigQuery Dataset ──────────────────────────────────────────────────
  {
    provider: 'gcp',
    resourceType: 'google_bigquery_dataset',
    displayName: 'BigQuery Dataset',
    friendlyName: 'Data Warehouse',
    description: 'Serverless, scalable data warehouse for analytics at any scale.',
    icon: '📊',
    color: GCP_BLUE,
    bgColor: GCP_BG,
    category: 'Analytics',
    tags: ['bigquery', 'analytics', 'data warehouse', 'sql', 'ml'],
    showInBeginner: false,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: [],
    secureDefaults: {
      delete_contents_on_destroy: false,
    },
    properties: [
      { key: 'dataset_id', label: 'Dataset ID', friendlyLabel: 'Dataset Name', type: 'string', required: true, placeholder: 'my_dataset' },
      { key: 'location', label: 'Location', friendlyLabel: 'Data Location', type: 'select', required: true, default: 'US', options: [
        { label: 'US (Multi-region)', value: 'US' },
        { label: 'EU (Multi-region)', value: 'EU' },
        { label: 'us-central1', value: 'us-central1' },
        { label: 'europe-west2', value: 'europe-west2' },
      ]},
      { key: 'default_table_expiration_ms', label: 'Table Expiration (ms)', friendlyLabel: 'Table Auto-Delete After (ms)', type: 'number', required: false },
    ],
  },

  // ─── Pub/Sub Topic ─────────────────────────────────────────────────────
  {
    provider: 'gcp',
    resourceType: 'google_pubsub_topic',
    displayName: 'Pub/Sub Topic',
    friendlyName: 'Messaging Topic',
    description: 'Asynchronous messaging for microservices and event-driven systems.',
    icon: '📨',
    color: '#ea4335',
    bgColor: 'rgba(234,67,53,0.08)',
    category: 'Messaging',
    tags: ['pubsub', 'messaging', 'event', 'async', 'gcp'],
    showInBeginner: false,
    showInIntermediate: true,
    canConnectTo: [
      { targetResourceType: 'google_cloudfunctions2_function', relationship: 'event_trigger_pubsub_topic' },
    ],
    canReceiveFrom: [],
    secureDefaults: {
      message_retention_duration: '86400s',
    },
    properties: [
      { key: 'name', label: 'Topic Name', friendlyLabel: 'Topic Name', type: 'string', required: true, placeholder: 'my-topic' },
      { key: 'message_retention_duration', label: 'Message Retention', friendlyLabel: 'Keep Messages For', type: 'select', required: false, default: '86400s', options: [
        { label: '10 minutes', value: '600s' },
        { label: '1 hour', value: '3600s' },
        { label: '1 day (default)', value: '86400s' },
        { label: '7 days (max)', value: '604800s' },
      ]},
    ],
  },

  // ─── Cloud Armor ───────────────────────────────────────────────────────
  {
    provider: 'gcp',
    resourceType: 'google_compute_security_policy',
    displayName: 'Cloud Armor',
    friendlyName: 'Web Firewall',
    description: 'DDoS protection and WAF for internet-facing applications.',
    icon: '🛡️',
    color: '#ea4335',
    bgColor: 'rgba(234,67,53,0.08)',
    category: 'Security',
    tags: ['security', 'waf', 'ddos', 'firewall', 'cloud armor'],
    showInBeginner: false,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: [],
    secureDefaults: {
      default_action: 'allow',
    },
    properties: [
      { key: 'name', label: 'Policy Name', friendlyLabel: 'Firewall Name', type: 'string', required: true, placeholder: 'my-security-policy' },
      { key: 'description', label: 'Description', friendlyLabel: 'Description', type: 'string', required: false },
      { key: 'default_action', label: 'Default Action', friendlyLabel: 'Default Action', type: 'select', required: false, default: 'allow', options: [
        { label: 'Allow', value: 'allow' }, { label: 'Deny (403)', value: 'deny(403)' },
      ]},
    ],
  },

  // ─── Cloud KMS ─────────────────────────────────────────────────────────
  {
    provider: 'gcp',
    resourceType: 'google_kms_key_ring',
    displayName: 'Cloud KMS Key Ring',
    friendlyName: 'Encryption Keys',
    description: 'Managed cryptographic keys for encrypting GCP resources.',
    icon: '🔐',
    color: '#607d8b',
    bgColor: 'rgba(96,125,139,0.08)',
    category: 'Security',
    tags: ['kms', 'encryption', 'keys', 'security', 'gcp'],
    showInBeginner: false,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: [],
    secureDefaults: {},
    properties: [
      { key: 'name', label: 'Key Ring Name', friendlyLabel: 'Key Ring Name', type: 'string', required: true, placeholder: 'my-key-ring' },
      { key: 'location', label: 'Location', friendlyLabel: 'Location', type: 'select', required: true, default: 'global', options: [
        { label: 'Global', value: 'global' }, { label: 'us-central1', value: 'us-central1' }, { label: 'europe-west1', value: 'europe-west1' },
      ]},
    ],
  },

  // ─── Cloud NAT ─────────────────────────────────────────────────────────
  {
    provider: 'gcp',
    resourceType: 'google_compute_router_nat',
    displayName: 'Cloud NAT',
    friendlyName: 'Private Internet Access',
    description: 'Allow private VMs to access the internet without public IPs.',
    icon: '🌐',
    color: GCP_BLUE,
    bgColor: GCP_BG,
    category: 'Network',
    tags: ['nat', 'networking', 'internet', 'private', 'routing'],
    showInBeginner: false,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: ['google_compute_subnetwork'],
    secureDefaults: {},
    properties: [
      { key: 'name', label: 'NAT Name', friendlyLabel: 'NAT Gateway Name', type: 'string', required: true, placeholder: 'my-nat' },
      { key: 'nat_ip_allocate_option', label: 'IP Allocation', friendlyLabel: 'IP Assignment', type: 'select', required: true, default: 'AUTO_ONLY', options: [
        { label: 'Automatic (Recommended)', value: 'AUTO_ONLY' },
        { label: 'Manual', value: 'MANUAL_ONLY' },
      ]},
      { key: 'source_subnetwork_ip_ranges_to_nat', label: 'Source Ranges', friendlyLabel: 'Which Subnets to NAT', type: 'select', required: true, default: 'ALL_SUBNETWORKS_ALL_IP_RANGES', options: [
        { label: 'All subnets', value: 'ALL_SUBNETWORKS_ALL_IP_RANGES' },
        { label: 'Primary ranges only', value: 'ALL_SUBNETWORKS_ALL_PRIMARY_IP_RANGES' },
        { label: 'Custom', value: 'LIST_OF_SUBNETWORKS' },
      ]},
    ],
  },

  // ─── Artifact Registry ─────────────────────────────────────────────────
  {
    provider: 'gcp',
    resourceType: 'google_artifact_registry_repository',
    displayName: 'Artifact Registry',
    friendlyName: 'Container Registry',
    description: 'Store and manage Docker images, npm packages, and other artifacts.',
    icon: '📦',
    color: '#34a853',
    bgColor: 'rgba(52,168,83,0.08)',
    category: 'Container',
    tags: ['registry', 'docker', 'artifacts', 'packages', 'container'],
    showInBeginner: false,
    showInIntermediate: true,
    canConnectTo: [],
    canReceiveFrom: [],
    secureDefaults: {},
    properties: [
      { key: 'repository_id', label: 'Repository ID', friendlyLabel: 'Registry Name', type: 'string', required: true, placeholder: 'my-registry' },
      { key: 'location', label: 'Location', friendlyLabel: 'Region', type: 'select', required: true, default: 'us-central1', options: [
        { label: 'US Central 1', value: 'us-central1' }, { label: 'Europe West 1', value: 'europe-west1' },
      ]},
      { key: 'format', label: 'Format', friendlyLabel: 'Package Format', type: 'select', required: true, default: 'DOCKER', options: [
        { label: 'Docker', value: 'DOCKER' },
        { label: 'npm', value: 'NPM' },
        { label: 'Python (PyPI)', value: 'PYTHON' },
        { label: 'Maven', value: 'MAVEN' },
        { label: 'Go', value: 'GO' },
      ]},
    ],
  },
];
