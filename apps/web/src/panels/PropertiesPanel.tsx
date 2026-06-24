import { useCallback } from 'react';
import { Trash2, Shield, AlertTriangle } from 'lucide-react';
import { useCanvasStore } from '../store/canvas';
import { getSchema, type PropertySchema } from '@terrabuilder/schemas';
import { useValidation } from '../hooks/useValidation';

export function PropertiesPanel() {
  const { selectedNodeId, nodes, mode, removeNode, updateNodeConfig, updateNodeName, applyAllFixes, securityReport } = useCanvasStore();
  const node = nodes.find(n => n.id === selectedNodeId);

  if (!node) {
    return (
      <div className="no-selection">
        <div className="no-selection-icon">⬡</div>
        <div className="no-selection-title">No resource selected</div>
        <div className="no-selection-sub">
          Click a resource on the canvas to edit its properties and view security findings.
        </div>
      </div>
    );
  }

  const schema = getSchema(node.data.resourceType);
  const score = securityReport.nodeScores[node.id] ?? 100;
  const findings = securityReport.findings.filter(f => f.nodeId === node.id);
  const scoreColor = score >= 80 ? 'var(--score-good)' : score >= 50 ? 'var(--score-warn)' : 'var(--score-bad)';
  const isBeginner = mode === 'beginner';

  // ── Validation
  const validation = useValidation(node);

  const handleConfigChange = useCallback((key: string, value: unknown) => {
    updateNodeConfig(node.id, { ...node.data.config, [key]: value });
  }, [node.id, node.data.config, updateNodeConfig]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeName(node.id, e.target.value);
  }, [node.id, updateNodeName]);

  const properties = schema?.properties.filter(p =>
    isBeginner ? p.showInBeginner : true
  ) ?? [];

  return (
    <div className="panel-content">
      {/* Node header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 0', marginBottom: 16,
        borderBottom: '1px solid var(--border)',
      }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 6, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${node.data.color}18`,
            border: `1px solid ${node.data.color}40`,
            flexShrink: 0,
          }}
        >
          {node.data.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
            {node.data.resourceType}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {node.data.provider.toUpperCase()} · {node.data.category}
          </div>
        </div>
        <div
          style={{
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
            color: scoreColor, border: `2px solid ${scoreColor}`,
            background: `${scoreColor}15`, flexShrink: 0,
          }}
          title={`Security score: ${score}/100`}
        >
          {score}
        </div>
      </div>

      {/* Validation issues badge */}
      {(validation.hasErrors || validation.hasWarnings) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', marginBottom: 12, borderRadius: 6,
          background: validation.hasErrors ? 'var(--red-dim)' : 'var(--amber-dim)',
          border: `1px solid ${validation.hasErrors ? 'var(--red)' : 'var(--amber)'}30`,
        }}>
          <AlertTriangle size={12} color={validation.hasErrors ? 'var(--red)' : 'var(--amber)'} />
          <span style={{ fontSize: 12, color: validation.hasErrors ? 'var(--red)' : 'var(--amber)', fontWeight: 600 }}>
            {validation.errorCount > 0 && `${validation.errorCount} error${validation.errorCount > 1 ? 's' : ''}`}
            {validation.errorCount > 0 && validation.warningCount > 0 && ' · '}
            {validation.warningCount > 0 && `${validation.warningCount} warning${validation.warningCount > 1 ? 's' : ''}`}
          </span>
        </div>
      )}

      {/* Security issues */}
      {findings.length > 0 && (
        <div className="prop-section">
          <div className="prop-section-title" style={{ color: findings.some(f => f.severity === 'CRITICAL') ? 'var(--red)' : 'var(--amber)' }}>
            ⚠ {findings.length} security issue{findings.length > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {findings.map(f => (
              <div key={f.ruleId} style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderLeft: `3px solid ${f.severity === 'CRITICAL' ? 'var(--red)' : f.severity === 'HIGH' ? 'var(--amber)' : 'var(--accent2)'}`,
                borderRadius: 4, padding: '8px 10px', fontSize: 11, color: 'var(--text-secondary)',
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, padding: '1px 5px',
                    borderRadius: 3, marginRight: 6,
                    background: f.severity === 'CRITICAL' ? 'var(--red-dim)' : 'var(--amber-dim)',
                    color: f.severity === 'CRITICAL' ? 'var(--red)' : 'var(--amber)',
                  }}>
                    {f.severity}
                  </span>
                  {f.ruleId}
                </div>
                {f.message}
                {f.autoFixAvailable && (
                  <button
                    className="autofix-btn"
                    style={{ marginTop: 8 }}
                    onClick={() => useCanvasStore.getState().applyFix(node.id, f.ruleId)}
                  >
                    ⚡ Auto-Fix
                  </button>
                )}
              </div>
            ))}
          </div>
          {findings.some(f => f.autoFixAvailable) && (
            <button className="btn btn-primary w-full" onClick={() => applyAllFixes(node.id)}>
              <Shield size={12} />
              Fix All Issues
            </button>
          )}
        </div>
      )}

      {/* Resource name */}
      <div className="prop-section">
        <div className="prop-section-title">Identification</div>
        <div className="prop-field">
          <label className="prop-label">
            <span className="prop-label-required" />
            {isBeginner ? 'Give it a name' : 'Resource Name (Terraform identifier)'}
          </label>
          <input
            className="prop-input"
            value={node.data.displayName}
            onChange={handleNameChange}
            placeholder="my-resource"
            style={{
              borderColor: validation.fieldErrors['displayName']
                ? (validation.fieldErrors['displayName'].severity === 'error' ? 'var(--red)' : 'var(--amber)')
                : validation.fieldErrors['_name_collision']
                  ? 'var(--amber)'
                  : undefined,
            }}
          />
          {validation.fieldErrors['displayName'] && (
            <div style={{ fontSize: 11, color: validation.fieldErrors['displayName'].severity === 'error' ? 'var(--red)' : 'var(--amber)', marginTop: 4 }}>
              {validation.fieldErrors['displayName'].message}
            </div>
          )}
          {!validation.fieldErrors['displayName'] && validation.fieldErrors['_name_collision'] && (
            <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 4 }}>
              {validation.fieldErrors['_name_collision'].message}
            </div>
          )}
        </div>
      </div>

      {/* Resource properties */}
      {properties.length > 0 && (
        <div className="prop-section">
          <div className="prop-section-title">
            {isBeginner ? 'Settings' : 'Configuration'}
          </div>
          {properties.map(prop => (
            <PropertyField
              key={prop.key}
              prop={prop}
              value={node.data.config[prop.key]}
              onChange={handleConfigChange}
              isBeginner={isBeginner}
              fieldError={validation.fieldErrors[prop.key]}
            />
          ))}
        </div>
      )}

      {/* Danger zone */}
      {!isBeginner && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button
            className="btn btn-danger w-full"
            onClick={() => removeNode(node.id)}
          >
            <Trash2 size={12} />
            Remove Resource
          </button>
        </div>
      )}
    </div>
  );
}

interface PropertyFieldProps {
  prop: PropertySchema;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  isBeginner: boolean;
  fieldError?: { severity: 'error' | 'warning' | 'ok'; message?: string };
}

function PropertyField({ prop, value, onChange, isBeginner, fieldError }: PropertyFieldProps) {
  const label = isBeginner ? prop.friendlyLabel : prop.label;
  const current = value ?? prop.default ?? '';
  const errorBorderColor = fieldError?.severity === 'error' ? 'var(--red)' : fieldError?.severity === 'warning' ? 'var(--amber)' : undefined;

  if (prop.type === 'boolean') {
    return (
      <div className="prop-field">
        <div
          className="prop-toggle"
          onClick={() => onChange(prop.key, !current)}
        >
          <span className="prop-toggle-label">{label}</span>
          <div className={`toggle-switch ${current ? 'on' : ''}`}>
            <div className="toggle-switch-thumb" />
          </div>
        </div>
        {prop.description && !isBeginner && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
            {prop.description}
          </div>
        )}
      </div>
    );
  }

  if (prop.type === 'select' && prop.options) {
    return (
      <div className="prop-field">
        <label className="prop-label">
          {prop.required && <span className="prop-label-required" />}
          {label}
        </label>
        <select
          className="prop-select"
          value={String(current)}
          onChange={e => onChange(prop.key, e.target.value)}
          style={{ borderColor: errorBorderColor }}
        >
          {prop.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }

  if (prop.type === 'number') {
    return (
      <div className="prop-field">
        <label className="prop-label">
          {prop.required && <span className="prop-label-required" />}
          {label}
        </label>
        <input
          className="prop-input"
          type="number"
          value={String(current)}
          min={prop.minValue}
          max={prop.maxValue}
          onChange={e => onChange(prop.key, Number(e.target.value))}
          style={{ borderColor: errorBorderColor }}
        />
        {fieldError && (
          <div style={{ fontSize: 11, color: errorBorderColor, marginTop: 4 }}>{fieldError.message}</div>
        )}
      </div>
    );
  }

  if (prop.type === 'password') {
    return (
      <div className="prop-field">
        <label className="prop-label">
          {prop.required && <span className="prop-label-required" />}
          {label}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', marginLeft: 6 }}>
            SENSITIVE
          </span>
        </label>
        <input
          className="prop-input"
          type="password"
          value={String(current)}
          placeholder="Use a Terraform variable or secrets manager"
          onChange={e => onChange(prop.key, e.target.value)}
        />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Will be emitted as var.{prop.key}_value in generated code
        </div>
      </div>
    );
  }

  if (prop.type === 'textarea') {
    return (
      <div className="prop-field">
        <label className="prop-label">
          {prop.required && <span className="prop-label-required" />}
          {label}
        </label>
        <textarea
          className="prop-textarea"
          value={String(current)}
          placeholder={prop.placeholder}
          onChange={e => onChange(prop.key, e.target.value)}
        />
      </div>
    );
  }

  // Default: text input
  return (
    <div className="prop-field">
      <label className="prop-label">
        {prop.required && <span className="prop-label-required" />}
        {label}
      </label>
      <input
        className="prop-input"
        type="text"
        value={String(current)}
        placeholder={prop.placeholder}
        onChange={e => onChange(prop.key, e.target.value)}
        style={{ borderColor: errorBorderColor }}
      />
      {fieldError && (
        <div style={{ fontSize: 11, color: errorBorderColor, marginTop: 4 }}>
          {fieldError.message}
        </div>
      )}
      {!fieldError && prop.description && !isBeginner && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
          {prop.description}
        </div>
      )}
    </div>
  );
}
