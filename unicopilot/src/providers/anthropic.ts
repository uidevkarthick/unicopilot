/**
 * src/providers/anthropic.ts
 * Anthropic Claude provider (claude-3-5-sonnet, claude-3-opus, etc.)
 */

import {
  AIProvider, ProviderConfig, CompletionRequest, CompletionResponse,
  ChatRequest, ChatResponse, ModelInfo, buildFimPrompt, cleanCompletion
} from './base';

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION = '2023-06-01';

const KNOWN_MODELS: ModelInfo[] = [
  { id: 'claude-opus-4-5',        name: 'Claude Opus 4.5',        contextWindow: 200000 },
  { id: 'claude-sonnet-4-5',      name: 'Claude Sonnet 4.5',      contextWindow: 200000 },
  { id: 'claude-haiku-3-5',       name: 'Claude Haiku 3.5',       contextWindow: 200000 },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet',  contextWindow: 200000 },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus',          contextWindow: 200000 },
  { id: 'claude-3-haiku-20240307',name: 'Claude 3 Haiku',         contextWindow: 200000 },
];

export class AnthropicProvider implements AIProvider {
  readonly id = 'anthropic';
  readonly name = 'Anthropic Claude';
  readonly requiresApiKey = true;

  async validate(config: ProviderConfig): Promise<void> {
    if (!config.apiKey?.trim()) {
      throw new Error('Anthropic API key is required. Get one at https://console.anthropic.com');
    }
    // Quick model list call to validate key
    const res = await this._fetch('/models', config, { method: 'GET' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Anthropic key validation failed: ${(body as any).error?.message ?? res.statusText}`);
    }
  }

  async listModels(config: ProviderConfig): Promise<ModelInfo[]> {
    try {
      const res = await this._fetch('/models', config, { method: 'GET' });
      if (!res.ok) { return KNOWN_MODELS; }
      const data = await res.json() as { data: { id: string }[] };
      return data.data
        .filter(m => m.id.startsWith('claude'))
        .map(m => ({
          id: m.id,
          name: m.id,
          ...KNOWN_MODELS.find(k => k.id === m.id),
        }));
    } catch {
      return KNOWN_MODELS;
    }
  }

  async complete(req: CompletionRequest, config: ProviderConfig): Promise<CompletionResponse> {
    const prompt = buildFimPrompt(req);
    const res = await this._fetch('/messages', config, {
      method: 'POST',
      body: JSON.stringify({
        model: config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: req.maxTokens,
        temperature: req.temperature,
        messages: [{ role: 'user', content: prompt }],
        system: 'You are an expert code completion engine. Output ONLY the code completion — no explanation, no markdown, no commentary.',
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) { throw new Error(data.error?.message ?? 'Anthropic completion failed'); }
    const raw = data.content?.[0]?.text ?? '';
    return { text: cleanCompletion(raw, req.prefix), finishReason: data.stop_reason };
  }

  async chat(req: ChatRequest, config: ProviderConfig): Promise<ChatResponse> {
    const { system, messages } = this._splitSystem(req.messages);
    const res = await this._fetch('/messages', config, {
      method: 'POST',
      body: JSON.stringify({
        model: config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: req.maxTokens,
        temperature: req.temperature,
        system,
        messages,
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) { throw new Error(data.error?.message ?? 'Anthropic chat failed'); }
    return { text: data.content?.[0]?.text ?? '', finishReason: data.stop_reason };
  }

  async chatStream(
    req: ChatRequest,
    config: ProviderConfig,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const { system, messages } = this._splitSystem(req.messages);
    const res = await this._fetch('/messages', config, {
      method: 'POST',
      body: JSON.stringify({
        model: config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: req.maxTokens,
        temperature: req.temperature,
        system,
        messages,
        stream: true,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new Error(err.error?.message ?? 'Anthropic stream failed');
    }
    await parseSSEStream(res, (event) => {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        onChunk(event.delta.text);
      }
    });
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private _splitSystem(messages: ChatRequest['messages']) {
    const systemMsg = messages.find(m => m.role === 'system');
    const rest = messages.filter(m => m.role !== 'system');
    return { system: systemMsg?.content ?? 'You are UniCopilot, an expert AI coding assistant.', messages: rest };
  }

  private _fetch(path: string, config: ProviderConfig, init: RequestInit) {
    return fetch(`${ANTHROPIC_API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey ?? '',
        'anthropic-version': ANTHROPIC_VERSION,
      },
    });
  }
}

async function parseSSEStream(res: Response, onEvent: (e: any) => void) {
  const reader = res.body?.getReader();
  if (!reader) { return; }
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) { break; }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try { onEvent(JSON.parse(line.slice(6))); } catch { /* skip */ }
      }
    }
  }
}
