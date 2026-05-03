'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
}

export default function MonacoEditor({
  value,
  onChange,
  language = 'html',
  height = '400px',
  readOnly = false,
}: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadMonaco = async () => {
      try {
        // Dynamic import of Monaco Editor
        const { editor } = await import('@monaco-editor/react');

        if (!isMounted) return;

        // Create editor instance
        if (editorRef.current && window.monaco) {
          monacoRef.current = window.monaco.editor.create(editorRef.current, {
            value,
            language,
            theme: 'vs-light',
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            readOnly,
            wordWrap: 'on',
            automaticLayout: true,
          });

          monacoRef.current.onDidChangeModelContent(() => {
            const newValue = monacoRef.current.getValue();
            onChange(newValue);
          });
        }
      } catch (err) {
        console.error('Failed to load Monaco Editor:', err);
        setError('Failed to load code editor');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Load Monaco Editor script if not already loaded
    if (!window.monaco) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/monaco-editor@0.44.0/min/vs/loader.js';
      script.onload = () => {
        // @ts-ignore
        window.require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.44.0/min/vs' } });
        // @ts-ignore
        window.require(['vs/editor/editor.main'], loadMonaco);
      };
      document.head.appendChild(script);
    } else {
      loadMonaco();
    }

    return () => {
      isMounted = false;
      if (monacoRef.current) {
        monacoRef.current.dispose();
      }
    };
  }, [value, language, onChange, readOnly]);

  useEffect(() => {
    if (monacoRef.current && value !== monacoRef.current.getValue()) {
      monacoRef.current.setValue(value);
    }
  }, [value]);

  if (error) {
    return (
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <p className="text-red-600 text-sm">{error}</p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-64 p-2 border rounded mt-2 font-mono text-sm"
          placeholder="Fallback text editor..."
        />
      </div>
    );
  }

  return (
    <div className="relative border rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading editor...
          </div>
        </div>
      )}
      <div
        ref={editorRef}
        style={{ height, width: '100%' }}
        className="min-h-[200px]"
      />
    </div>
  );
}