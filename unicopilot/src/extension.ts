/**
 * src/extension.ts
 * UniCopilot — Universal AI Coding Assistant for VS Code
 * Entry point: registers all commands, providers, and features.
 */

import * as vscode from 'vscode';
import { registerInlineCompletionProvider } from './features/inline-completion';
import { runCodeCommand } from './features/commands';
import { ChatPanelProvider } from './features/chat-panel';
import { createStatusBarItem, updateStatusBar } from './features/status-bar';
import { runProviderSetupWizard, runModelSwitcher } from './providers/registry';

// Output channel for logging and errors
const outputChannel = vscode.window.createOutputChannel('UniCopilot');

export function activate(context: vscode.ExtensionContext) {
  console.log('[UniCopilot] Activating…');
  outputChannel.appendLine('[UniCopilot] Activating…');

  const secrets = context.secrets;

  // ── Status bar ────────────────────────────────────────────────────────────
  const statusBarItem = createStatusBarItem();
  context.subscriptions.push(statusBarItem);
  context.subscriptions.push(outputChannel);

  // Update status bar when config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('unicopilot')) {
        updateStatusBar(statusBarItem);
      }
    })
  );

  // ── Chat sidebar ──────────────────────────────────────────────────────────
  const chatPanelProvider = new ChatPanelProvider(context.extensionUri, secrets);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatPanelProvider.viewId, chatPanelProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  // ── Inline completions ────────────────────────────────────────────────────
  context.subscriptions.push(registerInlineCompletionProvider(secrets));

  // ── Commands ──────────────────────────────────────────────────────────────

  // Open chat
  context.subscriptions.push(
    vscode.commands.registerCommand('unicopilot.openChat', () => {
      vscode.commands.executeCommand('workbench.view.extension.unicopilot');
    })
  );

  // Manual inline trigger
  context.subscriptions.push(
    vscode.commands.registerCommand('unicopilot.triggerInlineCompletion', () => {
      vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
    })
  );

  // Explain code
  context.subscriptions.push(
    vscode.commands.registerCommand('unicopilot.explainCode', () =>
      runCodeCommand('explain', secrets, chatPanelProvider)
    )
  );

  // Fix code
  context.subscriptions.push(
    vscode.commands.registerCommand('unicopilot.fixCode', () =>
      runCodeCommand('fix', secrets, chatPanelProvider)
    )
  );

  // Refactor code
  context.subscriptions.push(
    vscode.commands.registerCommand('unicopilot.refactorCode', () =>
      runCodeCommand('refactor', secrets, chatPanelProvider)
    )
  );

  // Add / configure provider (full wizard)
  context.subscriptions.push(
    vscode.commands.registerCommand('unicopilot.addProvider', () =>
      runProviderSetupWizard(secrets)
    )
  );

  // Switch model
  context.subscriptions.push(
    vscode.commands.registerCommand('unicopilot.switchModel', () =>
      runModelSwitcher(secrets)
    )
  );

  // Show status
  context.subscriptions.push(
    vscode.commands.registerCommand('unicopilot.showStatus', async () => {
      const cfg = vscode.workspace.getConfiguration('unicopilot');
      const provider = cfg.get<string>('activeProvider', 'ollama');
      const model = cfg.get<string>('activeModel', '(none)');
      const inlineEnabled = cfg.get<boolean>('inlineCompletionEnabled', true);
      vscode.window.showInformationMessage(
        `UniCopilot — Provider: ${provider} | Model: ${model} | Inline: ${inlineEnabled ? 'ON' : 'OFF'}`
      );
    })
  );

  // ── First-run onboarding ──────────────────────────────────────────────────
  const hasConfigured = context.globalState.get<boolean>('unicopilot.configured');
  if (!hasConfigured) {
    vscode.window.showInformationMessage(
      '👋 Welcome to UniCopilot! Configure your AI provider to get started.',
      'Configure Now',
      'Later'
    ).then(choice => {
      if (choice === 'Configure Now') {
        vscode.commands.executeCommand('unicopilot.addProvider');
        context.globalState.update('unicopilot.configured', true);
      }
    });
  }

  console.log('[UniCopilot] Activated ✅');
}

export function deactivate() {
  console.log('[UniCopilot] Deactivated.');
}
