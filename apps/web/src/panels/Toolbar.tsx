import { useCallback, useRef } from 'react';
import {
  Undo2, Redo2, Download, Upload, Trash2, LayoutTemplate,
  Code, Shield, ChevronUp, ChevronDown, GraduationCap, X,
  DollarSign, FileArchive, Camera
} from 'lucide-react';
import { useCanvasStore } from '../store/canvas';

const CLOUD_TABS = [
  { id: 'all' as const, label: 'All Clouds', dot: 'linear-gradient(135deg,#e8420a,#0078d4,#4285f4)' },
  { id: 'aws' as const, label: 'AWS', dot: 'var(--aws)' },
  { id: 'azure' as const, label: 'Azure', dot: 'var(--azure)' },
  { id: 'gcp' as const, label: 'GCP', dot: 'var(--gcp)' },
];

const MODE_TABS = [
  { id: 'beginner' as const, label: '🎓 Beginner' },
  { id: 'intermediate' as const, label: 'Intermediate' },
  { id: 'advanced' as const, label: 'Advanced' },
];

export function Toolbar() {
  const {
    mode, cloudFilter, nodes, edges,
    canUndo, canRedo, securityReport, costEstimate,
    undo, redo, clearCanvas, exportFile, exportZipBundle, importFile,
    setMode, setCloudFilter, setShowTemplates,
    bottomTab, bottomOpen, setBottomTab, toggleBottom,
  } = useCanvasStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      importFile(json);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [importFile]);

  const handleClearWithConfirm = useCallback(() => {
    if (nodes.length === 0) return;
    if (confirm('Clear the canvas? This cannot be undone (unless you use Ctrl+Z).')) {
      clearCanvas();
    }
  }, [nodes.length, clearCanvas]);

  const handleCaptureScreenshot = useCallback(() => {
    const canvasEl = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!canvasEl) return;
    
    // Create quick SVG snapshot
    const svgEl = document.querySelector('.react-flow__edges') as SVGElement;
    const svgData = svgEl ? new XMLSerializer().serializeToString(svgEl) : '';
    const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg">${svgData}</svg>`], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architecture-diagram.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const score = securityReport.canvasScore;
  const scoreColor = score >= 80 ? 'var(--score-good)' : score >= 50 ? 'var(--score-warn)' : 'var(--score-bad)';

  return (
    <div className="toolbar">
      {/* Logo */}
      <div className="toolbar-logo">
        <div className="toolbar-logo-mark">Terra<span>B</span>uilder</div>
        <div className="toolbar-logo-version">v0.2.0</div>
      </div>

      <div className="toolbar-divider" />

      {/* Templates */}
      <button className="btn" onClick={() => setShowTemplates(true)}>
        <LayoutTemplate size={13} />
        Templates
      </button>

      <div className="toolbar-divider" />

      {/* Cloud filter */}
      <div className="cloud-tabs">
        {CLOUD_TABS.map(tab => (
          <button
            key={tab.id}
            className={`cloud-tab ${cloudFilter === tab.id ? `active ${tab.id}` : ''}`}
            onClick={() => setCloudFilter(tab.id)}
          >
            <div
              className="cloud-tab-dot"
              style={{ background: cloudFilter === tab.id && tab.id !== 'all' ? tab.dot : undefined,
                       backgroundImage: tab.id === 'all' && cloudFilter === 'all' ? tab.dot : undefined }}
            />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="toolbar-divider" />

      {/* Experience mode */}
      <div className="mode-switch">
        {MODE_TABS.map(m => (
          <button
            key={m.id}
            className={`mode-btn ${m.id} ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="toolbar-spacer" />

      {/* Node/edge count */}
      {nodes.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {nodes.length}R / {edges.length}C
        </div>
      )}

      {/* Cost badge in toolbar */}
      {nodes.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 600, color: 'var(--accent)',
          background: 'rgba(99,102,241,0.1)', padding: '3px 8px', borderRadius: 4,
          border: '1px solid rgba(99,102,241,0.2)'
        }}>
          <DollarSign size={12} />
          ${costEstimate.totalMonthlyCost.toFixed(2)}/mo
        </div>
      )}

      {/* Security score in toolbar */}
      {nodes.length > 0 && (
        <button
          className="btn"
          onClick={() => { setBottomTab('security'); if (!bottomOpen) toggleBottom(); }}
          style={{ borderColor: scoreColor + '40', color: scoreColor }}
        >
          <Shield size={12} />
          {score}/100
          {securityReport.criticalCount > 0 && (
            <span style={{
              background: 'var(--red-dim)', color: 'var(--red)',
              fontFamily: 'var(--font-mono)', fontSize: 9, padding: '1px 5px',
              borderRadius: 3, fontWeight: 700,
            }}>
              {securityReport.criticalCount} CRIT
            </span>
          )}
        </button>
      )}

      <div className="toolbar-divider" />

      {/* Undo / Redo */}
      <div className="toolbar-section">
        <button className="icon-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <Undo2 size={13} />
        </button>
        <button className="icon-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          <Redo2 size={13} />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* File & Export actions */}
      <div className="toolbar-section">
        <button className="icon-btn" onClick={exportFile} title="Export .tbp project file" disabled={nodes.length === 0}>
          <Download size={13} />
        </button>
        <button className="icon-btn" onClick={exportZipBundle} title="Download Multi-File Project Bundle" disabled={nodes.length === 0}>
          <FileArchive size={13} />
        </button>
        <button className="icon-btn" onClick={handleCaptureScreenshot} title="Download Diagram SVG" disabled={nodes.length === 0}>
          <Camera size={13} />
        </button>
        <button className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Import .tbp project file">
          <Upload size={13} />
        </button>
        <button className="icon-btn danger" onClick={handleClearWithConfirm} title="Clear canvas" disabled={nodes.length === 0}>
          <Trash2 size={13} />
        </button>
        <input ref={fileInputRef} type="file" accept=".tbp,.json" style={{ display: 'none' }} onChange={handleImport} />
      </div>

      <div className="toolbar-divider" />

      {/* Bottom panel toggle */}
      <button
        className="btn"
        onClick={() => { setBottomTab('code'); if (!bottomOpen) toggleBottom(); else if (bottomTab === 'code') toggleBottom(); }}
        style={{ color: bottomTab === 'code' && bottomOpen ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        <Code size={12} />
        Code
        {bottomOpen && bottomTab === 'code' ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
      </button>
    </div>
  );
}

export function GraduationPrompt() {
  const { graduationPrompt, dismissGraduation, setMode } = useCanvasStore();
  if (!graduationPrompt) return null;

  return (
    <div className="graduation-prompt fade-in">
      <GraduationCap size={16} color="var(--green)" />
      <span className="graduation-text">
        You're getting good! <strong>Ready to try Intermediate mode?</strong>
      </span>
      <button className="btn" style={{ background: 'var(--green)', color: '#fff', border: 'none', padding: '4px 10px' }}
        onClick={() => { setMode('intermediate'); dismissGraduation(); }}>
        Upgrade
      </button>
      <button className="icon-btn" onClick={dismissGraduation}><X size={12} /></button>
    </div>
  );
}
