import { useCallback, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Copy, Download, Check } from 'lucide-react';
import { useCanvasStore } from '../store/canvas';
import { getFileExtension, getLanguageId } from '@terrabuilder/emitters';

const FORMAT_TABS = [
  { id: 'terraform' as const,      label: 'Terraform HCL', icon: '⬡' },
  { id: 'cloudformation' as const, label: 'CloudFormation', icon: '☁️' },
  { id: 'bicep' as const,          label: 'Azure Bicep', icon: '△' },
  { id: 'pulumi' as const,         label: 'Pulumi TS', icon: '🟣' },
];

export function CodePanel() {
  const { generatedCode, outputFormat, setOutputFormat } = useCanvasStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [generatedCode]);

  const handleDownload = useCallback(() => {
    const ext = getFileExtension(outputFormat);
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedCode, outputFormat]);

  const langId = getLanguageId(outputFormat);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Format tabs */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
      }}>
        {FORMAT_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setOutputFormat(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              color: outputFormat === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: `2px solid ${outputFormat === tab.id ? 'var(--accent)' : 'transparent'}`,
              transition: 'all 150ms ease',
              marginBottom: -1,
            }}
          >
            <span style={{ fontSize: 13 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="icon-btn" onClick={handleCopy} title="Copy to clipboard">
            {copied ? <Check size={13} color="var(--green)" /> : <Copy size={13} />}
          </button>
          <button className="icon-btn" onClick={handleDownload} title={`Download ${getFileExtension(outputFormat)}`}>
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MonacoEditor
          height="100%"
          language={langId === 'hcl' ? 'hcl' : langId}
          value={generatedCode}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 12,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            renderLineHighlight: 'none',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
            padding: { top: 12, bottom: 12 },
            wordWrap: 'on',
            guides: { indentation: false },
          }}
          beforeMount={monaco => {
            // Register HCL language if not already registered
            const langs = monaco.languages.getLanguages();
            if (!langs.find(l => l.id === 'hcl')) {
              monaco.languages.register({ id: 'hcl', aliases: ['HCL', 'Terraform'] });
              monaco.languages.setMonarchTokensProvider('hcl', {
                tokenizer: {
                  root: [
                    [/#.*/, 'comment'],
                    [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
                    [/\b(resource|provider|variable|output|module|data|terraform|locals|for_each|count|depends_on)\b/, 'keyword'],
                    [/\b(true|false|null)\b/, 'constant.language'],
                    [/[0-9]+(\.[0-9]+)?/, 'number'],
                    [/[{}()\[\]]/, 'delimiter.bracket'],
                    [/=/, 'operator'],
                    [/[a-zA-Z_][a-zA-Z0-9_\-.]*/, 'identifier'],
                  ],
                  string: [
                    [/[^"${]+/, 'string'],
                    [/\$\{/, { token: 'string.escape', next: '@interpolation' }],
                    [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
                  ],
                  interpolation: [
                    [/\}/, { token: 'string.escape', next: '@pop' }],
                    [/[^}]+/, 'variable'],
                  ],
                },
              });
            }
          }}
        />
      </div>
    </div>
  );
}
