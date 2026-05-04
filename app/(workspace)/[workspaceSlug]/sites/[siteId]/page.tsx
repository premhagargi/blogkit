'use client';

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
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
  ChevronRight,
  ChevronDown,
  PanelRightClose,
  PanelRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = lazy(() => import('@monaco-editor/react'));
import hljs from 'highlight.js';

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
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']));
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);

  // Editor line numbers state
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineCount = fileContent.split('\n').length;

  // Fetch file tree on mount
  useEffect(() => {
    const fetchFileTree = async () => {
      try {
        const response = await fetch(`/api/sites/${siteId}/file-tree`);
        if (response.ok) {
          const data = await response.json();
          setFileTree(data.fileTree);
          // Auto-expand root
          setExpandedDirs(new Set(['/']));
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

  // Auto-refresh preview on HTML file changes
  useEffect(() => {
    if (selectedFilePath?.endsWith('.html') || selectedFilePath?.endsWith('.htm')) {
      const timer = setTimeout(() => setPreviewKey(k => k + 1), 500);
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
      const response = await fetch(`/api/sites/${siteId}/deploy`, { method: 'POST' });
      if (!response.ok) {
        const err = await response.json();
        setError(err.error || 'Deploy failed');
      }
    } catch (err) {
      setError('Network error deploying');
    } finally {
      setDeploying(false);
    }
  };

  // Toggle directory expansion
  const toggleDir = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  // Render file tree with expand/collapse
  const renderTree = (nodes: FileTreeNode[], level: number = 0) => {
    return nodes.map(node => {
      const isSelected = node.path === selectedFilePath;
      const paddingLeft = level * 16 + 8;

      if (node.type === 'directory') {
        const isExpanded = expandedDirs.has(node.path);
        return (
          <div key={node.path}>
            <div
              className="flex items-center py-1 px-2 hover:bg-accent/50 cursor-pointer rounded transition-colors group"
              style={{ paddingLeft: `${paddingLeft}px` }}
              onClick={(e) => toggleDir(node.path, e)}
            >
              {node.children && node.children.length > 0 && (
                <ChevronRight
                  className={`w-3 h-3 mr-1 text-muted-foreground transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              )}
              {!node.children && <span className="w-3.5 mr-1 inline-block" />}
              <Folder className="w-4 h-4 mr-1.5 text-blue-500 flex-shrink-0" />
              <span className="text-sm truncate">{node.name}</span>
            </div>
            {isExpanded && node.children && (
              <div>{renderTree(node.children, level + 1)}</div>
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
            className={`flex items-center py-1 px-2 hover:bg-accent/50 cursor-pointer rounded transition-colors ${
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

  // Get file language for Monaco
  const getFileLanguage = (path: string) => {
    if (path.endsWith('.html') || path.endsWith('.htm')) return 'html';
    if (path.endsWith('.css')) return 'css';
    if (path.endsWith('.js')) return 'javascript';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  // Get file name from path
  const getFileName = (path: string) => path.split('/').pop() || path;

  // Build preview HTML
  const buildPreviewHtml = (): string => {
    if (!selectedFilePath || !fileContent) return '';
    const baseTag = `<base href="/api/sites/${siteId}/files/">`;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseTag}<style>body{margin:0;padding:20px;font-family:system-ui,-apple-system,sans-serif}</style></head><body>${fileContent}</body></html>`;
  };

  // Handle editor changes
  const handleEditorChange = (value: string | undefined) => {
    setFileContent(value || '');
    setHasUnsavedChanges(true);
  };

  // Monaco editor loader options
  const editorOptions = {
    fontSize: 14,
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
    lineHeight: 1.6,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on' as const,
    lineNumbers: 'on' as const,
    glyphMargin: false,
    folding: false,
    renderLineHighlight: 'line' as const,
    theme: 'vs-dark' as const,
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 flex-shrink-0 border-b bg-background flex items-center justify-between px-4">
        {/* Left: Site info + current file */}
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" asChild className="flex-shrink-0 h-8 px-2">
            <Link href={`/${workspaceSlug}/sites`}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="text-sm">Back</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold truncate">
                {selectedFilePath ? getFileName(selectedFilePath) : 'Site Editor'}
              </h1>
              {hasUnsavedChanges && (
                <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" title="Unsaved changes" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-[300px]">
              {selectedFilePath ? selectedFilePath : 'Select a file to edit'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges || loading || !selectedFilePath}
            className="h-8 px-3"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            <span className="text-sm">Save</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleCommit}
            disabled={committing || !saved || !selectedFilePath}
            className="h-8 px-3"
          >
            {committing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GitBranch className="w-4 h-4 mr-2" />}
            <span className="text-sm">Commit</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleDeploy}
            disabled={deploying || !saved || !selectedFilePath}
            className="h-8 px-3"
          >
            {deploying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
            <span className="text-sm">Deploy</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Tree */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 border-r bg-muted/20 flex flex-col transition-all duration-200 overflow-hidden`}>
          <div className="px-3 py-2 border-b">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Explorer</h2>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {loading && fileTree.length === 0 ? (
              <div className="p-3 space-y-1">
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
              <div className="py-1">{renderTree(fileTree)}</div>
            )}
          </div>
        </aside>

        {/* Sidebar Toggle (when closed) */}
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 border-r absolute left-0 top-0 z-10"
          >
            <PanelRight className="w-4 h-4" />
          </Button>
        )}

        {/* Editor Panel */}
        <main className="flex-1 flex flex-col min-w-0 bg-background">
           {/* Editor Toolbar */}
           <div className="flex-shrink-0 px-3 py-1.5 border-b bg-muted/10 flex items-center justify-between">
             <div className="flex items-center gap-2">
               {selectedFilePath && (
                 <>
                   <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-md">
                     {getFileName(selectedFilePath)}
                   </span>
                   <Badge variant="outline" className="text-xs h-5 px-2">
                     {getFileLanguage(selectedFilePath)}
                   </Badge>
                 </>
               )}
               {!selectedFilePath && (
                 <span className="text-sm text-muted-foreground">No file selected</span>
               )}
             </div>
             <div className="flex items-center gap-1">
               {selectedFilePath && (
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => setPreviewKey(k => k + 1)}
                   disabled={!selectedFilePath?.endsWith('.html') && !selectedFilePath?.endsWith('.htm')}
                   className="h-7 px-2 text-xs"
                 >
                   <RefreshCw className="w-3 h-3 mr-1" />
                   <span className="hidden sm:inline">Refresh</span>
                 </Button>
               )}
             </div>
           </div>

           {/* Monaco Editor */}
           <div className="flex-1 relative">
             <Suspense
               fallback={
                 <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e]">
                   <div className="flex flex-col items-center gap-2 text-muted-foreground">
                     <Loader2 className="w-6 h-6 animate-spin" />
                     <span className="text-sm">Loading editor...</span>
                   </div>
                 </div>
               }
             >
               {selectedFilePath && !loading && !error ? (
                 <MonacoEditor
                   key={selectedFilePath}
                   value={fileContent}
                   onChange={handleEditorChange}
                   language={getFileLanguage(selectedFilePath)}
                   options={editorOptions}
                   className="w-full h-full"
                 />
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] text-muted-foreground">
                   {loading ? (
                     <div className="flex flex-col items-center gap-2">
                       <Loader2 className="w-6 h-6 animate-spin" />
                       <span className="text-sm">Loading file...</span>
                     </div>
                   ) : error ? (
                     <div className="flex flex-col items-center gap-2 text-red-400 max-w-md text-center px-4">
                       <span className="text-lg font-semibold">Error</span>
                       <span className="text-sm">{error}</span>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center">
                       <FileText className="w-12 h-12 mb-3 opacity-50" />
                       <p className="text-sm">Select a file from the explorer to begin editing</p>
                     </div>
                   )}
                 </div>
               )}
             </Suspense>
           </div>
             <div className="flex items-center gap-1">
               {selectedFilePath && (
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => setPreviewKey(k => k + 1)}
                   disabled={!selectedFilePath?.endsWith('.html') && !selectedFilePath?.endsWith('.htm')}
                   className="h-7 px-2 text-xs"
                 >
                   <RefreshCw className="w-3 h-3 mr-1" />
                   <span className="hidden sm:inline">Refresh</span>
                 </Button>
               )}
             </div>
           </div>

           {/* Monaco Editor */}
           <div className="flex-1 relative">
             <Suspense
               fallback={
                 <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e]">
                   <div className="flex flex-col items-center gap-2 text-muted-foreground">
                     <Loader2 className="w-6 h-6 animate-spin" />
                     <span className="text-sm">Loading editor...</span>
                   </div>
                 </div>
               }
             >
               {selectedFilePath && !loading && !error ? (
                 <MonacoEditor
                   key={selectedFilePath}
                   value={fileContent}
                   onChange={handleEditorChange}
                   language={getFileLanguage(selectedFilePath)}
                   options={editorOptions}
                   className="w-full h-full"
                 />
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] text-muted-foreground">
                   {loading ? (
                     <div className="flex flex-col items-center gap-2">
                       <Loader2 className="w-6 h-6 animate-spin" />
                       <span className="text-sm">Loading file...</span>
                     </div>
                   ) : error ? (
                     <div className="flex flex-col items-center gap-2 text-red-400 max-w-md text-center px-4">
                       <span className="text-lg font-semibold">Error</span>
                       <span className="text-sm">{error}</span>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center">
                       <FileText className="w-12 h-12 mb-3 opacity-50" />
                       <p className="text-sm">Select a file from the explorer to begin editing</p>
                     </div>
                   )}
                 </div>
               )}
             </Suspense>
           </div>
        </main>

        {/* Preview Panel - Conditionally rendered based on screen size/pref */}
        {previewOpen && (
          <aside className="w-[40%] flex-shrink-0 border-l bg-white flex flex-col">
            <div className="flex-shrink-0 px-3 py-1.5 border-b bg-muted/10 flex items-center justify-between">
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
                  <span className="hidden sm:inline">Refresh</span>
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
              ) : selectedFilePath ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                  <div className="w-12 h-12 mb-3 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="w-6 h-6 opacity-50" />
                  </div>
                  <p className="text-sm">Preview requires an HTML file</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {getFileLanguage(selectedFilePath)}
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <FileText className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">No file selected</p>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Preview toggle button */}
        {!previewOpen && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
            className="absolute right-4 top-4 z-10 h-8 w-8 p-0"
          >
            <PanelRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
