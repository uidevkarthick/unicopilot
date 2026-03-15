/**
 * src/context/git-context.ts
 * Git integration for understanding code changes and history.
 */

import * as vscode from 'vscode';
import { execSync } from 'child_process';
import * as path from 'path';

export interface GitChange {
  file: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  diff: string;
}

export interface GitContext {
  branch: string;
  changes: GitChange[];
  recentCommits: GitCommit[];
  summary: string;
}

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export class GitContextProvider {
  /**
   * Check if current workspace is a git repository
   */
  isGitRepository(): boolean {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) return false;

      execSync('git rev-parse --git-dir', {
        cwd: workspaceFolder.uri.fsPath,
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current git context
   */
  async getGitContext(options?: {
    includeUnstaged?: boolean;
    includeStaged?: boolean;
    commitLimit?: number;
  }): Promise<GitContext | null> {
    if (!this.isGitRepository()) {
      return null;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return null;

    const cwd = workspaceFolder.uri.fsPath;

    try {
      // Get current branch
      const branch = this.getCurrentBranch(cwd);

      // Get changes
      const changes: GitChange[] = [];

      if (options?.includeUnstaged !== false) {
        changes.push(...this.getUnstagedChanges(cwd));
      }

      if (options?.includeStaged !== false) {
        changes.push(...this.getStagedChanges(cwd));
      }

      // Get recent commits
      const recentCommits = this.getRecentCommits(cwd, options?.commitLimit || 10);

      // Generate summary
      const summary = this.generateSummary(branch, changes, recentCommits);

      return {
        branch,
        changes,
        recentCommits,
        summary,
      };
    } catch (err: any) {
      console.error('[GitContextProvider] Error:', err);
      return null;
    }
  }

  /**
   * Get current branch name
   */
  private getCurrentBranch(cwd: string): string {
    try {
      const result = execSync('git branch --show-current', {
        cwd,
        encoding: 'utf8',
      });
      return result.trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get unstaged changes
   */
  private getUnstagedChanges(cwd: string): GitChange[] {
    try {
      const statusOutput = execSync('git status --porcelain', {
        cwd,
        encoding: 'utf8',
      });

      const changes: GitChange[] = [];
      const lines = statusOutput.trim().split('\n').filter(line => line);

      for (const line of lines) {
        const status = line.substring(0, 2);
        const file = line.substring(3).trim();

        // Skip staged-only changes
        if (status[1] === ' ') continue;

        const change: GitChange = {
          file,
          status: this.parseStatus(status[1]),
          diff: this.getDiff(cwd, file, false),
        };

        changes.push(change);
      }

      return changes;
    } catch {
      return [];
    }
  }

  /**
   * Get staged changes
   */
  private getStagedChanges(cwd: string): GitChange[] {
    try {
      const statusOutput = execSync('git status --porcelain', {
        cwd,
        encoding: 'utf8',
      });

      const changes: GitChange[] = [];
      const lines = statusOutput.trim().split('\n').filter(line => line);

      for (const line of lines) {
        const status = line.substring(0, 2);
        const file = line.substring(3).trim();

        // Skip unstaged-only changes
        if (status[0] === ' ' || status[0] === '?') continue;

        const change: GitChange = {
          file,
          status: this.parseStatus(status[0]),
          diff: this.getDiff(cwd, file, true),
        };

        changes.push(change);
      }

      return changes;
    } catch {
      return [];
    }
  }

  /**
   * Get diff for a file
   */
  private getDiff(cwd: string, file: string, staged: boolean): string {
    try {
      const command = staged ? `git diff --cached "${file}"` : `git diff "${file}"`;
      const result = execSync(command, {
        cwd,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024, // 1MB max
      });
      return result;
    } catch {
      return '';
    }
  }

  /**
   * Parse git status code
   */
  private parseStatus(statusCode: string): 'added' | 'modified' | 'deleted' | 'renamed' {
    switch (statusCode) {
      case 'A':
        return 'added';
      case 'M':
        return 'modified';
      case 'D':
        return 'deleted';
      case 'R':
        return 'renamed';
      default:
        return 'modified';
    }
  }

  /**
   * Get recent commits
   */
  private getRecentCommits(cwd: string, limit: number): GitCommit[] {
    try {
      const result = execSync(
        `git log -n ${limit} --pretty=format:"%H|%an|%ad|%s" --date=short`,
        {
          cwd,
          encoding: 'utf8',
        }
      );

      const lines = result.trim().split('\n').filter(line => line);
      const commits: GitCommit[] = [];

      for (const line of lines) {
        const [hash, author, date, message] = line.split('|');
        commits.push({ hash, author, date, message });
      }

      return commits;
    } catch {
      return [];
    }
  }

  /**
   * Generate summary
   */
  private generateSummary(
    branch: string,
    changes: GitChange[],
    commits: GitCommit[]
  ): string {
    const summary: string[] = [];

    summary.push(`Git Context:`);
    summary.push(`- Branch: ${branch}`);
    summary.push(`- Changes: ${changes.length} file(s)`);

    if (changes.length > 0) {
      const added = changes.filter(c => c.status === 'added').length;
      const modified = changes.filter(c => c.status === 'modified').length;
      const deleted = changes.filter(c => c.status === 'deleted').length;

      const parts: string[] = [];
      if (added > 0) parts.push(`${added} added`);
      if (modified > 0) parts.push(`${modified} modified`);
      if (deleted > 0) parts.push(`${deleted} deleted`);

      summary.push(`  (${parts.join(', ')})`);
    }

    summary.push(`- Recent commits: ${commits.length}`);

    return summary.join('\n');
  }

  /**
   * Format git context for LLM prompt
   */
  static formatForPrompt(context: GitContext): string {
    const sections: string[] = [];

    // Add summary
    sections.push('## Git Context\n');
    sections.push(context.summary);
    sections.push('\n');

    // Add current changes
    if (context.changes.length > 0) {
      sections.push('## Current Changes\n');
      for (const change of context.changes) {
        sections.push(`### ${change.file} (${change.status})\n`);
        if (change.diff) {
          sections.push('```diff');
          sections.push(change.diff);
          sections.push('```\n');
        }
      }
    }

    // Add recent commits
    if (context.recentCommits.length > 0) {
      sections.push('## Recent Commits\n');
      for (const commit of context.recentCommits) {
        sections.push(`- **${commit.hash.substring(0, 7)}** (${commit.date}): ${commit.message} — ${commit.author}`);
      }
      sections.push('\n');
    }

    return sections.join('\n');
  }

  /**
   * Get diff between current file and last commit
   */
  async getCurrentFileDiff(document: vscode.TextDocument): Promise<string | null> {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) return null;

    try {
      const relativePath = path.relative(workspaceFolder.uri.fsPath, document.uri.fsPath);
      const diff = execSync(`git diff HEAD "${relativePath}"`, {
        cwd: workspaceFolder.uri.fsPath,
        encoding: 'utf8',
      });
      return diff || null;
    } catch {
      return null;
    }
  }
}

// Global singleton
export const gitContextProvider = new GitContextProvider();
