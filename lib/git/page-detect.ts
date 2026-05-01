import { GitClient } from './index';
import type { GitFile } from './types';

export interface DetectedPage {
  path: string;
  title: string;
  type: 'html' | 'markdown' | 'other';
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
    const commonDirs = ['pages', 'docs', 'content', 'src'];

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

          for (const file of dirContentFiles.slice(0, 10)) { // Limit to 10 files per dir
            pages.push({
              path: file.path,
              title: getTitleFromFilename(file.name),
              type: getFileType(file.name),
            });
          }
        } catch (error) {
          // Skip directories we can't read
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

function getTitleFromFilename(filename: string): string {
  // Remove extension and convert to title case
  const name = filename.replace(/\.(html|htm|md)$/i, '');
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