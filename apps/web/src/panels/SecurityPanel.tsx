import { Shield, Zap } from 'lucide-react';
import { useCanvasStore } from '../store/canvas';

export function SecurityPanel() {
  const { securityReport, nodes, applyFix, applyCanvasFixes } = useCanvasStore();
  const { findings, canvasScore, criticalCount, highCount, mediumCount } = securityReport;

  const scoreColor = canvasScore >= 80 ? 'var(--score-good)' : canvasScore >= 50 ? 'var(--score-warn)' : 'var(--score-bad)';
  const autoFixableCount = findings.filter(f => f.autoFixAvailable).length;

  // Node display name helper
  const getNodeName = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.data.displayName ?? nodeId;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      <div style={{ padding: '16px' }}>
        {/* Overview stats */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 16,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '12px 16px',
          alignItems: 'center',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
              CANVAS SECURITY SCORE
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: scoreColor, lineHeight: 1 }}>
              {canvasScore}
              <span style={{ fontSize: 16, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontWeight: 400 }}>
                /100
              </span>
            </div>
            {securityReport.deployBlocked && (
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--red)', fontWeight: 700, letterSpacing: 0.5 }}>
                ⚠ DEPLOY BLOCKED — Fix critical issues first
              </div>
            )}
          </div>
          {autoFixableCount > 0 && (
            <button
              className="btn btn-primary"
              onClick={applyCanvasFixes}
              style={{ flexShrink: 0 }}
            >
              <Zap size={12} />
              Fix {autoFixableCount} issues
            </button>
          )}
        </div>

        {/* Severity breakdown */}
        {findings.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'CRITICAL', count: criticalCount, color: 'var(--red)', bg: 'var(--red-dim)' },
              { label: 'HIGH', count: highCount, color: 'var(--amber)', bg: 'var(--amber-dim)' },
              { label: 'MEDIUM', count: mediumCount, color: 'var(--accent2)', bg: 'var(--accent2-dim)' },
            ].map(({ label, count, color, bg }) => count > 0 && (
              <div key={label} style={{
                flex: 1, background: bg, border: `1px solid ${color}30`,
                borderRadius: 6, padding: '8px 12px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color, lineHeight: 1 }}>{count}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color, letterSpacing: 1, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Findings list */}
        {findings.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '32px 16px', gap: 12,
          }}>
            <Shield size={32} color="var(--green)" strokeWidth={1.5} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              All Clear!
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              {nodes.length === 0
                ? 'Add resources to start scanning for security issues.'
                : 'No security issues detected. All resources meet security requirements.'}
            </div>
          </div>
        ) : (
          <div className="finding-list">
            {findings.map((f, idx) => (
              <div key={`${f.ruleId}-${f.nodeId}-${idx}`} className={`finding-item ${f.severity}`}>
                <div className="finding-item-header">
                  <span className={`finding-severity ${f.severity}`}>{f.severity}</span>
                  <span className="finding-message">{f.message}</span>
                </div>
                <div className="finding-node">
                  Resource: {getNodeName(f.nodeId)} · Rule: {f.ruleId}
                </div>
                {f.autoFixAvailable && (
                  <div className="finding-actions">
                    <button
                      className="autofix-btn"
                      onClick={() => applyFix(f.nodeId, f.ruleId)}
                    >
                      ⚡ Auto-Fix — {f.autoFixDescription}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
