import { Code, Shield, ChevronUp, ChevronDown } from 'lucide-react';
import { useCanvasStore } from '../store/canvas';
import { CodePanel } from './CodePanel';
import { SecurityPanel } from './SecurityPanel';

export function BottomPanel() {
  const { bottomTab, bottomOpen, setBottomTab, toggleBottom, securityReport } = useCanvasStore();

  return (
    <div className={`bottom-panel ${bottomOpen ? 'expanded' : 'collapsed'}`}>
      <div className="bottom-panel-tabs">
        <button
          className={`bottom-tab ${bottomTab === 'code' && bottomOpen ? 'active' : ''}`}
          onClick={() => {
            if (bottomTab === 'code' && bottomOpen) toggleBottom();
            else { setBottomTab('code'); if (!bottomOpen) toggleBottom(); }
          }}
        >
          <Code size={13} />
          Infrastructure Code
        </button>

        <button
          className={`bottom-tab ${bottomTab === 'security' && bottomOpen ? 'active' : ''}`}
          onClick={() => {
            if (bottomTab === 'security' && bottomOpen) toggleBottom();
            else { setBottomTab('security'); if (!bottomOpen) toggleBottom(); }
          }}
        >
          <Shield size={13} />
          Security Scanner
          {securityReport.criticalCount > 0 && (
            <span style={{
              background: 'var(--red-dim)', color: 'var(--red)',
              fontFamily: 'var(--font-mono)', fontSize: 9,
              padding: '1px 6px', borderRadius: 3, fontWeight: 700, marginLeft: 4,
            }}>
              {securityReport.criticalCount}
            </span>
          )}
        </button>

        <div className="bottom-panel-spacer" />

        <button className="bottom-panel-toggle" onClick={toggleBottom}>
          {bottomOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          {bottomOpen ? 'Hide' : 'Show'}
        </button>
      </div>

      {bottomOpen && (
        <div className="bottom-panel-content">
          {bottomTab === 'code' && <CodePanel />}
          {bottomTab === 'security' && <SecurityPanel />}
        </div>
      )}
    </div>
  );
}
