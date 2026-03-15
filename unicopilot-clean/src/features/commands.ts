/**
 * src/features/commands.ts
 * Right-click code commands: Explain, Fix, Refactor.
 * Output goes to the UniCopilot output channel + chat panel.
 */

import * as vscode from 'vscode';
import { getActiveProvider } from '../providers/registry';
import { ChatMessage } from '../providers/base';

export type CommandType = 'explain' | 'fix' | 'refactor';

const SYSTEM_PROMPT = `You are UniCopilot, an expert software engineer and coding assistant.
Be concise, precise, and practical. Format code blocks with proper markdown fencing.`;

const PROMPTS: Record<CommandType, (code: string, lang: string) => string> = {
  explain: (code, lang) =>
    `Explain the following ${lang} code clearly and concisely. Describe what it does, how it works, and any important details:\n\n\`\`\`${lang}\n${code}\n\`\`\``,
  fix: (code, lang) =>
    `Identify and fix all bugs, errors, and issues in the following ${lang} code. Explain each fix briefly, then provide the corrected code:\n\n\`\`\`${lang}\n${code}\n\`\`\``,
  refactor: (code, lang) =>
    `Refactor the following ${lang} code for improved readability, maintainability, and performance. Explain the key changes, then provide the refactored code:\n\n\`\`\`${lang}\n${code}\n\`\`\``,
};

export async function runCodeCommand(
  type: CommandType,
  secrets: vscode.SecretStorage,
  chatPanel?: { postMessage: (msg: unknown) => void }
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('UniCopilot: No active editor.');
    return;
  }

  const selection = editor.selection;
  const code = editor.document.getText(
    selection.isEmpty
      ? new vscode.Range(new vscode.Position(0, 0), editor.document.lineAt(editor.document.lineCount - 1).range.end)
      : selection
  );

  if (!code.trim()) {
    vscode.window.showWarningMessage('UniCopilot: No code selected.');
    return;
  }

  const language = editor.document.languageId;
  const userPrompt = PROMPTS[type](code, language);
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  const label = type.charAt(0).toUpperCase() + type.slice(1);

  // If chat panel is open, stream there
  if (chatPanel) {
    chatPanel.postMessage({ type: 'userMessage', text: `**${label} selected code**` });
    chatPanel.postMessage({ type: 'startAssistantMessage' });

    try {
      const cfg = vscode.workspace.getConfiguration('unicopilot');
      const { provider, config } = await getActiveProvider(secrets);
      await provider.chatStream(
        { messages, maxTokens: cfg.get<number>('chatMaxTokens', 4096), temperature: 0.3 },
        config,
        (chunk) => chatPanel.postMessage({ type: 'chunk', text: chunk })
      );
      chatPanel.postMessage({ type: 'endAssistantMessage' });
    } catch (err: any) {
      chatPanel.postMessage({ type: 'error', text: err.message });
    }
    return;
  }

  // Fallback: output channel
  const channel = vscode.window.createOutputChannel('UniCopilot');
  channel.show(true);
  channel.appendLine(`\n── UniCopilot: ${label} ──────────────────────\n`);

  try {
    const cfg = vscode.workspace.getConfiguration('unicopilot');
    const { provider, config } = await getActiveProvider(secrets);
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: `UniCopilot: ${label}ing code…`, cancellable: false },
      async () => {
        await provider.chatStream(
          { messages, maxTokens: cfg.get<number>('chatMaxTokens', 4096), temperature: 0.3 },
          config,
          (chunk) => channel.append(chunk)
        );
      }
    );
    channel.appendLine('\n\n── Done ───────────────────────────────────\n');
  } catch (err: any) {
    channel.appendLine(`\n❌ Error: ${err.message}`);
    vscode.window.showErrorMessage(`UniCopilot: ${err.message}`);
  }
}
