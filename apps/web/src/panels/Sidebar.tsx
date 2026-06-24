import { useState, useMemo, useCallback } from 'react';
import { Search, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import {
  ALL_SCHEMAS,
  getBeginnerSchemas,
  getIntermediateSchemas,
  searchSchemas,
  type ResourceSchema,
} from '@terrabuilder/schemas';
import { useCanvasStore } from '../store/canvas';

const CATEGORY_ORDER = [
  'Compute', 'Serverless', 'Container', 'Database', 'Storage',
  'Network', 'Security', 'IAM', 'CDN & DNS', 'Messaging',
  'Monitoring', 'Analytics', 'AI & ML',
];

const PROVIDER_LABELS: Record<string, string> = {
  aws: 'AWS', azure: 'Azure', gcp: 'GCP',
};

export function Sidebar() {
  const { mode, cloudFilter } = useCanvasStore();
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const schemas = useMemo(() => {
    let base =
      mode === 'beginner' ? getBeginnerSchemas() :
      mode === 'intermediate' ? getIntermediateSchemas() :
      ALL_SCHEMAS;

    if (cloudFilter !== 'all') {
      base = base.filter(s => s.provider === cloudFilter);
    }

    if (query.trim()) {
      return searchSchemas(query).filter(s =>
        (cloudFilter === 'all' || s.provider === cloudFilter) &&
        (mode === 'beginner' ? s.showInBeginner : mode === 'intermediate' ? s.showInIntermediate : true)
      );
    }

    return base;
  }, [mode, cloudFilter, query]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, ResourceSchema[]>();
    for (const schema of schemas) {
      const cat = schema.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(schema);
    }
    // Sort by CATEGORY_ORDER
    return CATEGORY_ORDER
      .filter(cat => map.has(cat))
      .map(cat => ({ category: cat, items: map.get(cat)! }));
  }, [schemas]);

  const toggleCategory = useCallback((cat: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, schema: ResourceSchema) => {
    e.dataTransfer.setData('application/terrabuilder-resource', schema.resourceType);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const beginnerCount = mode === 'beginner' ? schemas.length : undefined;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          {mode === 'beginner' ? '🎓 Resources' : 'Resource Palette'}
          {beginnerCount !== undefined && (
            <span style={{ marginLeft: 8, color: 'var(--accent)', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11 }}>
              {beginnerCount}
            </span>
          )}
        </div>
        <div className="search-input-wrap">
          <Search size={13} className="search-icon" />
          <input
            className="search-input"
            type="text"
            placeholder={`Search ${schemas.length} resources...`}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="sidebar-content">
        {grouped.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No resources match your search
          </div>
        )}

        {grouped.map(({ category, items }) => (
          <div key={category} className="resource-category">
            <div
              className="category-label"
              onClick={() => toggleCategory(category)}
            >
              {collapsed.has(category) ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              <Layers size={11} />
              {category}
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-disabled)' }}>
                {items.length}
              </span>
            </div>

            {!collapsed.has(category) && (
              <div className="resource-items">
                {items.map(schema => (
                  <ResourcePaletteItem
                    key={schema.resourceType}
                    schema={schema}
                    onDragStart={handleDragStart}
                    showProvider={cloudFilter === 'all'}
                    isBeginner={mode === 'beginner'}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

interface ResourcePaletteItemProps {
  schema: ResourceSchema;
  onDragStart: (e: React.DragEvent, schema: ResourceSchema) => void;
  showProvider: boolean;
  isBeginner: boolean;
}

function ResourcePaletteItem({ schema, onDragStart, showProvider, isBeginner }: ResourcePaletteItemProps) {
  return (
    <div
      className="resource-item"
      draggable
      onDragStart={e => onDragStart(e, schema)}
      title={schema.description}
    >
      <div
        className="resource-icon-wrap"
        style={{
          background: `${schema.color}18`,
          border: `1px solid ${schema.color}30`,
        }}
      >
        {schema.icon}
      </div>
      <div className="resource-item-info">
        <div className="resource-item-name">
          {isBeginner ? schema.friendlyName : schema.displayName}
        </div>
        {!isBeginner && (
          <div className="resource-item-type">
            {showProvider && (
              <span style={{ color: schema.color, marginRight: 4, fontWeight: 600 }}>
                {PROVIDER_LABELS[schema.provider]}
              </span>
            )}
            {schema.resourceType}
          </div>
        )}
      </div>
    </div>
  );
}
