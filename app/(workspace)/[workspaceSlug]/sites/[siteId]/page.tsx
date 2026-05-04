'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Folder,
  FileCode,
  RefreshCw,
  GitBranch,
  ExternalLink,
  FileJson,
  File,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  extension?: string;
}

interface PageContent {
  content: string;
  lastSyncedCommitSha?: string | null;
}

export default function SiteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.siteId as string;
  const workspaceSlug = params.workspaceSlug as string;
  const initialPath = params.path as string | undefined;

  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(initialPath || null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Preview
  const [previewKey, setPreviewKey] = useState(0);

  // Build HTML preview synchronously with base tag for relative URLs
  const buildPreviewHtml = (): string => {
    if (!selectedFilePath || !fileContent) return '';
    const baseTag = `<base href="/api/sites/${siteId}/files/">`;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseTag}
          <style>body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }</style>
        </head>
        <body>
          ${fileContent}
        </body>
      </html>
    `;
  };

  // Fetch file tree on mount
  useEffect(() => {
    const fetchFileTree = async () => {
      try {
        const response = await fetch(`/api/sites/${siteId}/file-tree`);
        if (response.ok) {
          const data = await response.json();
          setFileTree(data.fileTree);
        } else {
          setError('Failed to load file tree');
        }
      } catch (err) {
        setError('Network error loading file tree');
      } finally {
        setLoading(false);
      }
    };
    fetchFileTree();
  }, [siteId]);

  // Load file content when selected
  useEffect(() => {
    if (!selectedFilePath) return;

    const loadFile = async () => {
      setLoading(true);
      setError(null);
      try {
        const encodedPath = encodeURIComponent(selectedFilePath);
        const response = await fetch(`/api/sites/${siteId}/pages?path=${encodedPath}`);
        if (response.ok) {
          const data: PageContent = await response.json();
          setFileContent(data.content);
          setSaved(false);
          setHasUnsavedChanges(false);
        } else {
          setError('Failed to load file');
        }
      } catch (err) {
        setError('Network error loading file');
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [selectedFilePath, siteId]);

  // Auto-refresh preview when file content changes (for HTML files)
  useEffect(() => {
    if (selectedFilePath?.endsWith('.html') || selectedFilePath?.endsWith('.htm')) {
      const timer = setTimeout(() => {
        setPreviewKey(k => k + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [fileContent, selectedFilePath]);

  const handleSave = async () => {
    if (!selectedFilePath || !hasUnsavedChanges) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/pages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFilePath, content: fileContent }),
      });

      if (response.ok) {
        setSaved(true);
        setHasUnsavedChanges(false);
      } else {
        const err = await response.json();
        setError(err.error || 'Save failed');
      }
    } catch (err) {
      setError('Network error saving file');
    } finally {
      setSaving(false);
    }
  };

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Update site files' }),
      });

      if (response.ok) {
        setSaved(true);
        setHasUnsavedChanges(false);
      } else {
        const err = await response.json();
        setError(err.error || 'Commit failed');
      }
    } catch (err) {
      setError('Network error committing');
    } finally {
      setCommitting(false);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/deploy`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
      } else {
        const err = await response.json();
        setError(err.error || 'Deploy failed');
      }
    } catch (err) {
      setError('Network error deploying');
    } finally {
      setDeploying(false);
    }
  };

  const [previewHtml, setPreviewHtml] = useState<string>('');

  // Build HTML preview
  useEffect(() => {
    if (!selectedFilePath || !fileContent) {
      setPreviewHtml('');
      return;
    }

    let isMounted = true;
    const buildPreview = async () => {
      let html = fileContent;

      // Try to inline linked CSS and JS files for self-contained preview
      try {
        const allFiles = collectAllFiles(fileTree);
        const cssFiles = allFiles.filter(f => f.extension === 'css');
        const jsFiles = allFiles.filter(f => f.extension === 'js');

        // Inline CSS files that are linked but not in the HTML
        for (const cssFile of cssFiles) {
          const cssPath = cssFile.path;
          if (!html.includes(`href="${cssPath}"`) && !html.includes(`href='${cssPath}'`)) {
            const cssResponse = await fetch(`/api/sites/${siteId}/files?path=${encodeURIComponent(cssPath)}`);
            if (cssResponse.ok) {
              const cssContent = await cssResponse.text();
              // Inject before </head>
              if (html.includes('</head>')) {
                html = html.replace('</head>', `<style>${cssContent}</style></head>`);
              } else {
                html = `<style>${cssContent}</style>\n${html}`;
              }
            }
          }
        }

        // Inline JS files that are linked but not in the HTML
        for (const jsFile of jsFiles) {
          const jsPath = jsFile.path;
          if (!html.includes(`src="${jsPath}"`) && !html.includes(`src='${jsPath}'`)) {
            const jsResponse = await fetch(`/api/sites/${siteId}/files?path=${encodeURIComponent(jsPath)}`);
            if (jsResponse.ok) {
              const jsContent = await jsResponse.text();
              // Inject before </body>
              if (html.includes('</body>')) {
                html = html.replace('</body>', `<script>${jsContent}</script></body>`);
              } else {
                html = `${html}\n<script>${jsContent}</script>`;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Could not inline assets for preview:', err);
      }

      if (isMounted) {
        setPreviewHtml(html);
      }
    };

    const timer = setTimeout(buildPreview, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedFilePath, fileContent, fileTree, siteId]);

  // Render file tree recursively
  const renderFileTree = (nodes: FileTreeNode[], level: number = 0) => {
    return nodes.map(node => {
      const isSelected = node.path === selectedFilePath;
      const paddingLeft = level * 16 + 8;

      if (node.type === 'directory') {
        return (
          <div key={node.path}>
            <div
              className="flex items-center py-1.5 px-2 hover:bg-accent/50 cursor-pointer rounded transition-colors group"
              style={{ paddingLeft: `${paddingLeft}px` }}
            >
              <Folder className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
              <span className="text-sm text-foreground truncate">{node.name}</span>
            </div>
            {node.children && (
              <div>
                {renderFileTree(node.children, level + 1)}
              </div>
            )}
          </div>
        );
      } else {
        const getIcon = () => {
          const ext = node.extension || '';
          if (ext === 'js') return <FileCode className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0" />;
          if (ext === 'css') return <FileCode className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />;
          if (ext === 'html' || ext === 'htm') return <FileText className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" />;
          if (ext === 'json') return <FileJson className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />;
          return <File className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />;
        };

        return (
          <div
            key={node.path}
            className={`flex items-center py-1.5 px-2 hover:bg-accent/50 cursor-pointer rounded transition-colors ${
              isSelected ? 'bg-accent border-l-2 border-primary' : ''
            }`}
            style={{ paddingLeft: `${paddingLeft}px` }}
            onClick={() => setSelectedFilePath(node.path)}
          >
            {getIcon()}
            <span className="text-sm truncate">{node.name}</span>
          </div>
        );
      }
    });
  };

  const getFileLanguage = (path: string) => {
    if (path.endsWith('.html') || path.endsWith('.htm')) return 'HTML';
    if (path.endsWith('.css')) return 'CSS';
    if (path.endsWith('.js')) return 'JavaScript';
    if (path.endsWith('.json')) return 'JSON';
    if (path.endsWith('.md')) return 'Markdown';
    return 'Text';
  };

  const getFileName = (path: string) => {
    return path.split('/').pop() || path;
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 flex-shrink-0 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
            <Link href={`/${workspaceSlug}/sites`}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="text-sm">Back</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">
              {selectedFilePath ? getFileName(selectedFilePath) : 'No file selected'}
            </h1>
            {selectedFilePath && (
              <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                {selectedFilePath}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-xs text-orange-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Unsaved
              </span>
            )}
          </div>
          <div className="w-px h-6 bg-border mx-2" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges || loading || !selectedFilePath}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              <span className="text-sm">Save</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCommit}
              disabled={committing || !saved || !selectedFilePath}
            >
              {committing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <GitBranch className="w-4 h-4 mr-2" />
              )}
              <span className="text-sm">Commit</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDeploy}
              disabled={deploying || !saved || !selectedFilePath}
            >
              {deploying ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              <span className="text-sm">Deploy</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Tree */}
        <aside className="w-64 flex-shrink-0 border-r bg-muted/20 flex flex-col">
          <div className="px-4 py-3 border-b">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Explorer
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {loading && fileTree.length === 0 ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-2 py-1.5 px-2">
                    <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded flex-1 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : fileTree.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No files in repository
              </div>
            ) : (
              <div className="py-1">
                {renderFileTree(fileTree)}
              </div>
            )}
          </div>
        </aside>

        {/* Editor Panel */}
        <main className="flex-1 flex flex-col min-w-0 bg-background">
          {/* Editor Toolbar */}
          <div className="flex-shrink-0 px-4 py-2 border-b bg-muted/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedFilePath && (
                <>
                  <span className="text-sm font-medium truncate max-w-md">
                    {getFileName(selectedFilePath)}
                  </span>
                  <Badge variant="outline" className="text-xs h-5 px-2">
                    {getFileLanguage(selectedFilePath)}
                  </Badge>
                </>
              )}
              {!selectedFilePath && (
                <span className="text-sm text-muted-foreground">Select a file to edit</span>
              )}
            </div>
            {selectedFilePath && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewKey(k => k + 1)}
                disabled={!selectedFilePath?.endsWith('.html') && !selectedFilePath?.endsWith('.htm')}
                className="h-7 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh Preview
              </Button>
            )}
          </div>

          {/* Editor Area */}
          <div className="flex-1 relative overflow-hidden bg-[#1e1e1e]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e]">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm">Loading file...</span>
                </div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e]">
                <div className="flex flex-col items-center gap-2 text-red-400 max-w-md text-center px-4">
                  <span className="text-lg font-semibold">Error</span>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            ) : selectedFilePath ? (
              <textarea
                value={fileContent}
                onChange={(e) => {
                  setFileContent(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="absolute inset-0 w-full h-full p-4 bg-transparent text-gray-200 resize-none focus:outline-none font-mono text-sm leading-6"
                style={{
                  fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace',
                  lineHeight: '1.6',
                  tabSize: 2,
                }}
                spellCheck={false}
                placeholder="// Start typing..."
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <FileText className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Select a file from the explorer to begin editing</p>
              </div>
            )}
          </div>
        </main>

        {/* Preview Panel */}
        <aside className="w-[40%] flex-shrink-0 border-l bg-white flex flex-col">
          <div className="flex-shrink-0 px-4 py-2 border-b bg-muted/10 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Preview
            </h2>
            {selectedFilePath?.endsWith('.html') || selectedFilePath?.endsWith('.htm') ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewKey(k => k + 1)}
                className="h-7 px-2 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">HTML only</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden bg-white">
            {selectedFilePath?.endsWith('.html') || selectedFilePath?.endsWith('.htm') ? (
              <iframe
                key={previewKey}
                srcDoc={buildPreviewHtml()}
                className="w-full h-full border-0"
                title="Preview"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <FileText className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">No file selected</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
