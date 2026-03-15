/**
 * src/providers/registry.ts
 * Central registry — resolves the active provider at runtime.
 * Adding a new provider: import it, add one line to PROVIDERS map.
 */

import * as vscode from 'vscode';
import { AIProvider, ProviderConfig } from './base';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { OllamaProvider } from './ollama';
import { NvidiaNimProvider } from './nvidia-nim';
import { OpenAICompatProvider } from './openai-compat';
import { OpenAIProvider } from './openai';
import { OpenRouterProvider } from './openrouter';

// ── Registry ─────────────────────────────────────────────────────────────────

const PROVIDERS = new Map<string, AIProvider>([
  ['ollama',        new OllamaProvider()],
  ['anthropic',     new AnthropicProvider()],
  ['gemini',        new GeminiProvider()],
  ['nvidia-nim',    new NvidiaNimProvider()],
  ['openai',        new OpenAIProvider()],
  ['openrouter',    new OpenRouterProvider()],
  ['openai-compat', new OpenAICompatProvider()],
]);

export function getAllProviders(): AIProvider[] {
  return Array.from(PROVIDERS.values());
}

export function getProvider(id: string): AIProvider | undefined {
  return PROVIDERS.get(id);
}

// ── Config resolution ─────────────────────────────────────────────────────────

export async function getActiveProvider(
  secrets: vscode.SecretStorage
): Promise<{ provider: AIProvider; config: ProviderConfig }> {
  const cfg = vscode.workspace.getConfiguration('unicopilot');
  const providerId = cfg.get<string>('activeProvider', 'ollama');
  const provider = PROVIDERS.get(providerId);

  if (!provider) {
    throw new Error(`Unknown provider "${providerId}". Please configure UniCopilot.`);
  }

  const config = await buildConfig(providerId, secrets, cfg);
  return { provider, config };
}

export async function buildConfig(
  providerId: string,
  secrets: vscode.SecretStorage,
  cfg?: vscode.WorkspaceConfiguration
): Promise<ProviderConfig> {
  const c = cfg ?? vscode.workspace.getConfiguration('unicopilot');
  const apiKey = (await secrets.get(`unicopilot.${providerId}.apiKey`)) ?? '';

  const baseUrls: Record<string, string> = {
    'ollama':        c.get<string>('ollamaBaseUrl', 'http://localhost:11434'),
    'openai-compat': c.get<string>('customProviderBaseUrl', ''),
  };

  return {
    apiKey,
    baseUrl: baseUrls[providerId],
    model: c.get<string>('activeModel', ''),
  };
}

// ── Provider setup wizard ─────────────────────────────────────────────────────

export async function runProviderSetupWizard(
  secrets: vscode.SecretStorage
): Promise<void> {
  const providers = getAllProviders();
  const picked = await vscode.window.showQuickPick(
    providers.map(p => ({ label: p.name, description: p.requiresApiKey ? 'API key required' : 'No API key needed', id: p.id })),
    { title: 'UniCopilot: Select Provider', placeHolder: 'Choose an AI provider' }
  );
  if (!picked) { return; }

  const provider = PROVIDERS.get(picked.id)!;

  // Collect API key if required
  let apiKey = '';
  if (provider.requiresApiKey) {
    const input = await vscode.window.showInputBox({
      title: `${provider.name} — API Key`,
      prompt: 'Enter your API key (stored securely in VS Code Secret Storage)',
      password: true,
      ignoreFocusOut: true,
    });
    if (!input) { return; }
    apiKey = input;
    await secrets.store(`unicopilot.${picked.id}.apiKey`, apiKey);
  }

  // Collect base URL if needed
  const cfg = vscode.workspace.getConfiguration('unicopilot');
  if (picked.id === 'ollama') {
    const url = await vscode.window.showInputBox({
      title: 'Ollama Base URL',
      value: cfg.get<string>('ollamaBaseUrl', 'http://localhost:11434'),
      ignoreFocusOut: true,
    });
    if (url) { await cfg.update('ollamaBaseUrl', url, true); }
  }
  if (picked.id === 'openai-compat') {
    const url = await vscode.window.showInputBox({
      title: 'Custom Provider Base URL',
      prompt: 'e.g. https://api.groq.com/openai/v1 or http://localhost:1234/v1',
      value: cfg.get<string>('customProviderBaseUrl', ''),
      ignoreFocusOut: true,
    });
    if (url) { await cfg.update('customProviderBaseUrl', url, true); }

    const name = await vscode.window.showInputBox({
      title: 'Custom Provider Display Name',
      value: cfg.get<string>('customProviderName', 'Custom Provider'),
      ignoreFocusOut: true,
    });
    if (name) { await cfg.update('customProviderName', name, true); }
  }

  // Validate
  const config = await buildConfig(picked.id, secrets);
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: `Validating ${provider.name}…` },
    async () => provider.validate(config)
  );

  // Pick model
  await runModelSwitcher(secrets, picked.id);

  // Set active
  await cfg.update('activeProvider', picked.id, true);
  vscode.window.showInformationMessage(`✅ UniCopilot: ${provider.name} configured successfully!`);
}

export async function runModelSwitcher(
  secrets: vscode.SecretStorage,
  providerId?: string
): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('unicopilot');
  const activeId = providerId ?? cfg.get<string>('activeProvider', 'ollama');
  const provider = PROVIDERS.get(activeId);
  if (!provider) { return; }

  const config = await buildConfig(activeId, secrets);

  const models = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: `Fetching models from ${provider.name}…` },
    () => provider.listModels(config)
  );

  if (!models.length) {
    vscode.window.showWarningMessage('No models found. Check your provider configuration.');
    return;
  }

  const picked = await vscode.window.showQuickPick(
    models.map(m => ({ label: m.name || m.id, description: m.description, id: m.id })),
    { title: `Select model — ${provider.name}`, placeHolder: 'Choose a model' }
  );
  if (!picked) { return; }
  await cfg.update('activeModel', picked.id, true);
  vscode.window.showInformationMessage(`UniCopilot: Model set to ${picked.label}`);
}
