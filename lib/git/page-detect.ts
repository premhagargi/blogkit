import { GitClient } from './index';
import type { GitFile } from './types';

export interface DetectedPage {
  path: string;
  title: string;
  type: 'html' | 'markdown' | 'other';
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  extension?: string;
}

export async function detectPages(
  client: GitClient,
  ownerOrId: string,
  repo: string,
  branch?: string
): Promise<DetectedPage[]> {
  try {
    const files = await client.listFiles(ownerOrId, repo, '', branch);
    const pages: DetectedPage[] = [];

    // Check for common static site structures
    const rootFiles = files.filter(f => f.type === 'file');

    // Look for index files
    const indexFiles = ['index.html', 'index.htm', 'index.md', 'README.md'];
    for (const indexFile of indexFiles) {
      const file = rootFiles.find(f => f.name === indexFile);
      if (file) {
        pages.push({
          path: file.path,
          title: getTitleFromFilename(file.name),
          type: getFileType(file.name),
        });
        break; // Only add one index page
      }
    }

    // Look for other HTML/MD files
    const contentFiles = rootFiles.filter(f =>
      f.name.endsWith('.html') ||
      f.name.endsWith('.htm') ||
      f.name.endsWith('.md')
    );

    for (const file of contentFiles) {
      if (!pages.some(p => p.path === file.path)) {
        pages.push({
          path: file.path,
          title: getTitleFromFilename(file.name),
          type: getFileType(file.name),
        });
      }
    }

    // Check common directories
    const dirs = files.filter(f => f.type === 'dir');
    const commonDirs = ['pages', 'docs', 'content', 'src', 'public', 'static', 'assets'];

    for (const dir of dirs) {
      if (commonDirs.includes(dir.name)) {
        try {
          const dirFiles = await client.listFiles(ownerOrId, repo, dir.path, branch);
          const dirContentFiles = dirFiles.filter(f =>
            f.type === 'file' && (
              f.name.endsWith('.html') ||
              f.name.endsWith('.htm') ||
              f.name.endsWith('.md')
            )
          );

          for (const file of dirContentFiles.slice(0, 50)) { // Limit per dir
            pages.push({
              path: file.path,
              title: getTitleFromFilename(file.name),
              type: getFileType(file.name),
            });
          }
        } catch (error) {
          console.warn(`Could not read directory ${dir.path}:`, error);
        }
      }
    }

    return pages;
  } catch (error) {
    console.error('Error detecting pages:', error);
    return [];
  }
}

/**
 * Build a complete file tree for the repository
 */
export async function buildFileTree(
  client: GitClient,
  ownerOrId: string,
  repo: string,
  branch?: string
): Promise<FileTreeNode[]> {
  try {
    const files = await client.listFiles(ownerOrId, repo, '', branch);

    // Filter out common ignore patterns
    const ignoredPrefixes = [
      'node_modules/',
      '.git/',
      'dist/',
      'build/',
      '.next/',
      '.cache/',
      'coverage/',
      '.idea/',
      '.vscode/',
      'tmp/',
      'temp/',
    ];

    const filteredFiles = files.filter(file => {
      // Skip dotfiles and dotdirectories (except common ones like .env if needed)
      const name = file.name || '';
      if (name.startsWith('.') && name !== '.env' && name !== '.htaccess') {
        return false;
      }
      // Skip ignored prefixes
      return !ignoredPrefixes.some(prefix => file.path.startsWith(prefix));
    });

    return buildTreeFromFiles(filteredFiles);
  } catch (error) {
    console.error('Error building file tree:', error);
    return [];
  }
}

function buildTreeFromFiles(files: GitFile[]): FileTreeNode[] {
  const nodes: FileTreeNode[] = [];
  const dirMap = new Map<string, FileTreeNode>();

  // First pass: create all directory nodes
  for (const file of files) {
    const parts = file.path.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i];
      currentPath = currentPath ? `${currentPath}/${dirName}` : dirName;

      if (!dirMap.has(currentPath)) {
        const dirNode: FileTreeNode = {
          name: dirName,
          path: currentPath,
          type: 'directory',
          children: [],
        };
        dirMap.set(currentPath, dirNode);
      }
    }
  }

  // Second pass: add files and link children
  for (const file of files) {
    const parts = file.path.split('/');
    const fileName = parts[parts.length - 1];
    const fileNode: FileTreeNode = {
      name: fileName,
      path: file.path,
      type: 'file',
      extension: getFileExtension(fileName),
    };

    if (parts.length === 1) {
      // Root level file
      nodes.push(fileNode);
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      const parentDir = dirMap.get(parentPath);
      if (parentDir) {
        parentDir.children!.push(fileNode);
      }
    }
  }

  // Link directories to their parents
  for (const [path, dirNode] of dirMap) {
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash === -1) {
      // Root level directory
      nodes.push(dirNode);
    } else {
      const parentPath = path.substring(0, lastSlash);
      const parentDir = dirMap.get(parentPath);
      if (parentDir) {
        parentDir.children!.push(dirNode);
      } else {
        nodes.push(dirNode);
      }
    }
  }

  // Sort: directories first, then files, alphabetically
  const sortNodes = (arr: FileTreeNode[]) => {
    arr.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    for (const node of arr) {
      if (node.children) {
        sortNodes(node.children);
      }
    }
  };

  sortNodes(nodes);

  return nodes;
}

function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ext;
}

function getTitleFromFilename(filename: string): string {
  const name = filename.replace(/\.(html|htm|md|js|css|json)$/i, '');
  return name
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getFileType(filename: string): 'html' | 'markdown' | 'other' {
  if (filename.endsWith('.html') || filename.endsWith('.htm')) {
    return 'html';
  }
  if (filename.endsWith('.md')) {
    return 'markdown';
  }
  return 'other';
}