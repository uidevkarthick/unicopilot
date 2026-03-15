/**
 * src/context/workspace-context.ts
 * Multi-file context awareness for better code understanding.
 */

import * as vscode from 'vscode';
import * as path from 'path';

export interface FileContext {
  path: string;
  relativePath: string;
  content: string;
  language: string;
  size: number;
}

export interface WorkspaceContext {
  files: FileContext[];
  structure: string;
  summary: string;
}

export class WorkspaceContextProvider {
  private readonly MAX_FILE_SIZE = 100000; // 100KB max per file
  private readonly MAX_TOTAL_SIZE = 500000; // 500KB total context
  private readonly MAX_FILES = 20; // Max 20 files in context

  /**
   * Get context for the current workspace
   */
  async getWorkspaceContext(options?: {
    includePatterns?: string[];
    excludePatterns?: string[];
    maxFiles?: number;
  }): Promise<WorkspaceContext> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return {
        files: [],
        structure: 'No workspace folder open',
        summary: 'No workspace available',
      };
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const files: FileContext[] = [];
    let totalSize = 0;

    // Default patterns
    const includePatterns = options?.includePatterns || [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      '**/*.py',
      '**/*.java',
      '**/*.go',
      '**/*.rs',
      '**/*.c',
      '**/*.cpp',
      '**/*.h',
      '**/*.md',
    ];

    const excludePatterns = options?.excludePatterns || [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/out/**',
      '**/.git/**',
      '**/coverage/**',
      '**/__pycache__/**',
      '**/*.min.js',
      '**/*.bundle.js',
    ];

    // Find relevant files
    for (const pattern of includePatterns) {
      const foundFiles = await vscode.workspace.findFiles(
        pattern,
        `{${excludePatterns.join(',')}}`,
        options?.maxFiles || this.MAX_FILES
      );

      for (const uri of foundFiles) {
        if (files.length >= (options?.maxFiles || this.MAX_FILES)) break;
        if (totalSize >= this.MAX_TOTAL_SIZE) break;

        try {
          const document = await vscode.workspace.openTextDocument(uri);
          const content = document.getText();
          const size = Buffer.byteLength(content, 'utf8');

          // Skip if file is too large
          if (size > this.MAX_FILE_SIZE) continue;
          if (totalSize + size > this.MAX_TOTAL_SIZE) continue;

          files.push({
            path: uri.fsPath,
            relativePath: path.relative(rootPath, uri.fsPath),
            content,
            language: document.languageId,
            size,
          });

          totalSize += size;
        } catch (err) {
          // Skip files that can't be read
          continue;
        }
      }

      if (files.length >= (options?.maxFiles || this.MAX_FILES)) break;
    }

    // Generate structure tree
    const structure = this.generateStructureTree(files, rootPath);

    // Generate summary
    const summary = this.generateSummary(files);

    return { files, structure, summary };
  }

  /**
   * Get context for specific files
   */
  async getFilesContext(uris: vscode.Uri[]): Promise<FileContext[]> {
    const files: FileContext[] = [];
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const rootPath = workspaceFolders?.[0]?.uri.fsPath || '';

    for (const uri of uris) {
      try {
        const document = await vscode.workspace.openTextDocument(uri);
        const content = document.getText();
        const size = Buffer.byteLength(content, 'utf8');

        if (size <= this.MAX_FILE_SIZE) {
          files.push({
            path: uri.fsPath,
            relativePath: rootPath ? path.relative(rootPath, uri.fsPath) : uri.fsPath,
            content,
            language: document.languageId,
            size,
          });
        }
      } catch (err) {
        // Skip files that can't be read
        continue;
      }
    }

    return files;
  }

  /**
   * Get related files for the current file (imports, dependencies, etc.)
   */
  async getRelatedFiles(document: vscode.TextDocument): Promise<FileContext[]> {
    const content = document.getText();
    const relatedPaths = this.extractImportPaths(content, document.languageId);
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

    if (!workspaceFolder) return [];

    const relatedFiles: FileContext[] = [];

    for (const relPath of relatedPaths) {
      try {
        // Resolve relative path
        const dir = path.dirname(document.uri.fsPath);
        const resolvedPath = path.resolve(dir, relPath);
        const uri = vscode.Uri.file(resolvedPath);

        const doc = await vscode.workspace.openTextDocument(uri);
        const fileContent = doc.getText();
        const size = Buffer.byteLength(fileContent, 'utf8');

        if (size <= this.MAX_FILE_SIZE) {
          relatedFiles.push({
            path: uri.fsPath,
            relativePath: path.relative(workspaceFolder.uri.fsPath, uri.fsPath),
            content: fileContent,
            language: doc.languageId,
            size,
          });
        }
      } catch {
        // Skip if file can't be found/read
        continue;
      }
    }

    return relatedFiles;
  }

  /**
   * Extract import paths from code
   */
  private extractImportPaths(content: string, languageId: string): string[] {
    const paths: string[] = [];

    // TypeScript/JavaScript
    if (['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(languageId)) {
      const importRegex = /(?:import|require)\s*\(?\s*['"]([^'"]+)['"]\s*\)?/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        // Only include relative imports
        if (importPath.startsWith('.')) {
          paths.push(this.normalizeImportPath(importPath, languageId));
        }
      }
    }

    // Python
    if (languageId === 'python') {
      const importRegex = /(?:from|import)\s+([.\w]+)/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('.')) {
          paths.push(importPath.replace(/\./g, '/') + '.py');
        }
      }
    }

    return paths;
  }

  /**
   * Normalize import path to file path
   */
  private normalizeImportPath(importPath: string, languageId: string): string {
    if (['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(languageId)) {
      // Add extensions if missing
      if (!path.extname(importPath)) {
        const extensions = ['ts', 'tsx', 'js', 'jsx'];
        for (const ext of extensions) {
          return `${importPath}.${ext}`;
        }
      }
    }
    return importPath;
  }

  /**
   * Generate a tree structure of files
   */
  private generateStructureTree(files: FileContext[], rootPath: string): string {
    const tree: Record<string, any> = {};

    for (const file of files) {
      const parts = file.relativePath.split(path.sep);
      let current = tree;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          current[part] = null; // Leaf node
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      }
    }

    return this.treeToString(tree);
  }

  /**
   * Convert tree object to string representation
   */
  private treeToString(tree: Record<string, any>, indent = ''): string {
    const lines: string[] = [];

    for (const [key, value] of Object.entries(tree)) {
      if (value === null) {
        lines.push(`${indent}├── ${key}`);
      } else {
        lines.push(`${indent}├── ${key}/`);
        lines.push(this.treeToString(value, indent + '│   '));
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate a summary of the workspace
   */
  private generateSummary(files: FileContext[]): string {
    const languageCounts: Record<string, number> = {};
    let totalLines = 0;

    for (const file of files) {
      languageCounts[file.language] = (languageCounts[file.language] || 0) + 1;
      totalLines += file.content.split('\n').length;
    }

    const summary = [
      `Workspace Summary:`,
      `- Total files: ${files.length}`,
      `- Total lines: ${totalLines}`,
      `- Languages: ${Object.entries(languageCounts)
        .map(([lang, count]) => `${lang} (${count})`)
        .join(', ')}`,
    ];

    return summary.join('\n');
  }

  /**
   * Format workspace context for LLM prompt
   */
  static formatForPrompt(context: WorkspaceContext): string {
    const sections: string[] = [];

    // Add summary
    sections.push('## Workspace Overview\n');
    sections.push(context.summary);
    sections.push('\n');

    // Add structure
    sections.push('## Project Structure\n');
    sections.push('```');
    sections.push(context.structure);
    sections.push('```\n');

    // Add file contents
    if (context.files.length > 0) {
      sections.push('## Relevant Files\n');
      for (const file of context.files) {
        sections.push(`### ${file.relativePath}\n`);
        sections.push(`\`\`\`${file.language}`);
        sections.push(file.content);
        sections.push('```\n');
      }
    }

    return sections.join('\n');
  }
}

// Global singleton
export const workspaceContextProvider = new WorkspaceContextProvider();
