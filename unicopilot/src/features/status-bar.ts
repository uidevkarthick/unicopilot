/**
 * src/features/status-bar.ts
 * Status bar item showing active provider + model, click to switch.
 */

import * as vscode from 'vscode';

export function createStatusBarItem(): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.command = 'unicopilot.switchModel';
  updateStatusBar(item);
  item.show();
  return item;
}

export function updateStatusBar(item: vscode.StatusBarItem) {
  const cfg = vscode.workspace.getConfiguration('unicopilot');
  const provider = cfg.get<string>('activeProvider', 'ollama');
  const model = cfg.get<string>('activeModel', '');

  const providerLabel: Record<string, string> = {
    'ollama': '🦙',
    'anthropic': '🔶',
    'gemini': '✦',
    'nvidia-nim': '🟢',
    'openai': '🟦',
    'openai-compat': '⚙',
  };

  const icon = providerLabel[provider] ?? '🤖';
  const label = model
    ? model.split('/').pop()?.split(':')[0] ?? model
    : provider;

  item.text = `${icon} ${label}`;
  item.tooltip = `UniCopilot: ${provider}${model ? ` / ${model}` : ''}\nClick to switch model`;
}
