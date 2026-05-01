'use client';

import { useState } from 'react';
import { FileText, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: PageNode[];
}

interface PagesTreeProps {
  pages: Array<{
    id: string;
    path: string;
  }>;
  selectedPath?: string;
  onSelect: (path: string) => void;
}

export default function PagesTree({ pages, selectedPath, onSelect }: PagesTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  // Build tree structure
  const buildTree = (pages: Array<{ id: string; path: string }>): PageNode[] => {
    const tree: { [key: string]: PageNode } = {};
    const root: PageNode[] = [];

    pages.forEach((page) => {
      const parts = page.path.split('/').filter(Boolean);
      let current = root;
      let currentPath = '';

      parts.forEach((part, index) => {
        currentPath += '/' + part;
        const isFile = index === parts.length - 1;

        let node = current.find(n => n.name === part);
        if (!node) {
          node = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'dir',
            children: isFile ? undefined : [],
          };
          current.push(node);
        }

        if (!isFile && node.children) {
          current = node.children;
        }
      });
    });

    return root;
  };

  const tree = buildTree(pages);

  const toggleDir = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const renderNode = (node: PageNode, depth = 0): JSX.Element => {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = selectedPath === node.path;

    return (
      <div key={node.path}>
        <button
          onClick={() => {
            if (node.type === 'dir') {
              toggleDir(node.path);
            } else {
              onSelect(node.path);
            }
          }}
          className={cn(
            'flex items-center gap-1 w-full text-left px-2 py-1 text-sm hover:bg-muted/50 rounded',
            isSelected && 'bg-muted'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {node.type === 'dir' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4" />
              ) : (
                <Folder className="w-4 h-4" />
              )}
            </>
          ) : (
            <>
              <div className="w-3 h-3" /> {/* Spacer */}
              <FileText className="w-4 h-4" />
            </>
          )}
          <span className="truncate">{node.name}</span>
        </button>

        {node.type === 'dir' && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-lg">
      <div className="px-3 py-2 text-sm font-medium border-b bg-muted/20">
        Pages
      </div>
      <div className="max-h-96 overflow-y-auto">
        {tree.length === 0 ? (
          <div className="px-3 py-4 text-center text-muted-foreground text-sm">
            No pages found
          </div>
        ) : (
          tree.map((node) => renderNode(node))
        )}
      </div>
    </div>
  );
}