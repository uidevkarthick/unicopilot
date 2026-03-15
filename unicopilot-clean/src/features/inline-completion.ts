/**
 * src/features/inline-completion.ts
 * Ghost-text inline completions — both automatic (debounced) and manual trigger.
 */

import * as vscode from 'vscode';
import { getActiveProvider } from '../providers/registry';
import { Cache } from '../utils/cache';
import { RateLimiter } from '../utils/rate-limiter';

export class UniCopilotInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
  private _lastRequestId = 0;
  private readonly _cache = new Cache<string>(60); // 60 second cache
  private readonly _rateLimiter = new RateLimiter(500); // 500ms min interval

  constructor(private readonly _secrets: vscode.SecretStorage) {}

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionList | null> {
    const cfg = vscode.workspace.getConfiguration('unicopilot');
    if (!cfg.get<boolean>('inlineCompletionEnabled', true)) { return null; }

    // Bail on very short lines (avoid spamming completions on empty lines unless user triggered)
    const lineText = document.lineAt(position).text.trim();
    if (lineText.length < 2 && _context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic) {
      return null;
    }

    const requestId = ++this._lastRequestId;

    try {
      const contextLines = cfg.get<number>('contextLines', 50);
      const prefix = this._getPrefix(document, position, contextLines);
      const suffix = this._getSuffix(document, position, contextLines);

      if (token.isCancellationRequested) { return null; }

      // Check cache first
      const cacheKey = `${prefix}|${suffix}|${document.languageId}`;
      const cached = this._cache.get(cacheKey);
      if (cached) {
        return {
          items: [new vscode.InlineCompletionItem(cached, new vscode.Range(position, position))],
        };
      }

      // Apply rate limiting
      await this._rateLimiter.acquire();

      const { provider, config } = await getActiveProvider(this._secrets);

      if (token.isCancellationRequested || requestId !== this._lastRequestId) { return null; }

      const result = await provider.complete(
        {
          prefix,
          suffix,
          language: document.languageId,
          filename: document.fileName,
          maxTokens: cfg.get<number>('maxTokens', 512),
          temperature: cfg.get<number>('temperature', 0.2),
        },
        config
      );

      if (token.isCancellationRequested || requestId !== this._lastRequestId) { return null; }
      if (!result.text.trim()) { return null; }

      // Cache the result
      this._cache.set(cacheKey, result.text);

      const insertText = this._formatCompletion(result.text, document, position);
      if (!insertText.trim()) { return null; }

      return {
        items: [
          new vscode.InlineCompletionItem(
            insertText,
            new vscode.Range(position, position)
          ),
        ],
      };
    } catch (err: any) {
      // Don't show error toasts on every keystroke — only log
      console.error(`[UniCopilot] Inline completion error: ${err?.message}`);
      return null;
    }
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private _getPrefix(doc: vscode.TextDocument, pos: vscode.Position, contextLines: number): string {
    const start = Math.max(0, pos.line - contextLines);
    const range = new vscode.Range(new vscode.Position(start, 0), pos);
    return doc.getText(range);
  }

  private _getSuffix(doc: vscode.TextDocument, pos: vscode.Position, contextLines: number): string {
    const end = Math.min(doc.lineCount - 1, pos.line + contextLines);
    const lineEnd = doc.lineAt(end).range.end;
    const range = new vscode.Range(pos, lineEnd);
    return doc.getText(range);
  }

  private _formatCompletion(
    text: string,
    document: vscode.TextDocument,
    position: vscode.Position
  ): string {
    // If completion starts on same line, keep as-is.
    // If it contains newlines, ensure indentation matches current line.
    const currentIndent = document.lineAt(position).text.match(/^(\s*)/)?.[1] ?? '';
    const lines = text.split('\n');
    if (lines.length === 1) { return text; }
    return [
      lines[0],
      ...lines.slice(1).map((l, i) =>
        i === lines.length - 2 && l.trim() === '' ? '' : currentIndent + l
      ),
    ].join('\n');
  }
}

/**
 * Register the provider and return a disposable.
 */
export function registerInlineCompletionProvider(
  secrets: vscode.SecretStorage
): vscode.Disposable {
  const provider = new UniCopilotInlineCompletionProvider(secrets);
  return vscode.languages.registerInlineCompletionItemProvider(
    { pattern: '**' }, // all file types
    provider
  );
}
