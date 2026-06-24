import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Toolbar, GraduationPrompt } from './panels/Toolbar';
import { Sidebar } from './panels/Sidebar';
import { TerraCanvas } from './canvas/TerraCanvas';
import { PropertiesPanel } from './panels/PropertiesPanel';
import { BottomPanel } from './panels/BottomPanel';
import { TemplateGallery } from './panels/TemplateGallery';
import { useCanvasStore } from './store/canvas';

export function App() {
  const { showTemplates, undo, redo } = useCanvasStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      if (isTyping) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return (
    <ReactFlowProvider>
      <div className="app">
        {/* Toolbar */}
        <Toolbar />

        {/* Main body */}
        <div className="app-body">
          {/* Left: Resource Palette */}
          <Sidebar />

          {/* Center + Bottom: Canvas area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            {/* Canvas */}
            <TerraCanvas />

            {/* Graduation prompt (floats over canvas) */}
            <GraduationPrompt />

            {/* Bottom panel (Code + Security) */}
            <BottomPanel />
          </div>

          {/* Right: Properties Panel */}
          <div className="right-panel">
            <div className="panel-header">
              <span className="panel-title">Properties</span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <PropertiesPanel />
            </div>
          </div>
        </div>

        {/* Template gallery modal */}
        {showTemplates && <TemplateGallery />}
      </div>
    </ReactFlowProvider>
  );
}
