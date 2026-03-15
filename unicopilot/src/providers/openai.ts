/**
 * src/providers/openai.ts
 * Native OpenAI provider (GPT-4, GPT-3.5-turbo, o1, etc.)
 */

import {
  AIProvider, ProviderConfig, CompletionRequest, CompletionResponse,
  ChatRequest, ChatResponse, ModelInfo, buildFimPrompt, cleanCompletion
} from './base';
import { parseOpenAIStream } from './nvidia-nim';

const OPENAI_BASE = 'https://api.openai.com/v1';

const KNOWN_MODELS: ModelInfo[] = [
  { id: 'gpt-4o',                    name: 'GPT-4o',                    contextWindow: 128000 },
  { id: 'gpt-4o-mini',               name: 'GPT-4o Mini',               contextWindow: 128000 },
  { id: 'gpt-4-turbo',               name: 'GPT-4 Turbo',               contextWindow: 128000 },
  { id: 'gpt-4',                     name: 'GPT-4',                     contextWindow: 8192 },
  { id: 'o1',                        name: 'o1',                        contextWindow: 200000 },
  { id: 'o1-mini',                   name: 'o1 Mini',                   contextWindow: 128000 },
  { id: 'gpt-3.5-turbo',             name: 'GPT-3.5 Turbo',             contextWindow: 16385 },
];

export class OpenAIProvider implements AIProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  readonly requiresApiKey = true;

  async validate(config: ProviderConfig): Promise<void> {
    if (!config.apiKey?.trim()) {
      throw new Error('OpenAI API key required. Get one at https://platform.openai.com');
    }
    const res = await this._fetch('/models', config, { method: 'GET' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as any;
      throw new Error(body.error?.message ?? `OpenAI validation failed: ${res.statusText}`);
    }
  }

  async listModels(config: ProviderConfig): Promise<ModelInfo[]> {
    try {
      const res = await this._fetch('/models', config, { method: 'GET' });
      if (!res.ok) { return KNOWN_MODELS; }
      const data = await res.json() as { data: { id: string }[] };
      return data.data
        .filter(m => m.id.startsWith('gpt-') || m.id.startsWith('o1'))
        .map(m => ({
          id: m.id,
          name: KNOWN_MODELS.find(k => k.id === m.id)?.name ?? m.id,
          ...KNOWN_MODELS.find(k => k.id === m.id),
        }));
    } catch {
      return KNOWN_MODELS;
    }
  }

  async complete(req: CompletionRequest, config: ProviderConfig): Promise<CompletionResponse> {
    const prompt = buildFimPrompt(req);
    const model = config.model || 'gpt-4o-mini';

    const res = await this._fetch('/chat/completions', config, {
      method: 'POST',
      body: JSON.stringify({
        model,
        max_tokens: req.maxTokens,
        temperature: Math.min(req.temperature, 2), // OpenAI max is 2
        messages: [
          { role: 'system', content: 'You are an expert code completion engine. Output ONLY the code completion — no explanation, no markdown, no commentary.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) { throw new Error(data.error?.message ?? 'OpenAI completion failed'); }
    const raw = data.choices?.[0]?.message?.content ?? '';
    return { text: cleanCompletion(raw, req.prefix), finishReason: data.choices?.[0]?.finish_reason };
  }

  async chat(req: ChatRequest, config: ProviderConfig): Promise<ChatResponse> {
    const model = config.model || 'gpt-4o';

    const res = await this._fetch('/chat/completions', config, {
      method: 'POST',
      body: JSON.stringify({
        model,
        max_tokens: req.maxTokens,
        temperature: Math.min(req.temperature, 2),
        messages: req.messages,
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) { throw new Error(data.error?.message ?? 'OpenAI chat failed'); }
    return { text: data.choices?.[0]?.message?.content ?? '', finishReason: data.choices?.[0]?.finish_reason };
  }

  async chatStream(
    req: ChatRequest,
    config: ProviderConfig,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const model = config.model || 'gpt-4o';

    const res = await this._fetch('/chat/completions', config, {
      method: 'POST',
      body: JSON.stringify({
        model,
        max_tokens: req.maxTokens,
        temperature: Math.min(req.temperature, 2),
        messages: req.messages,
        stream: true,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new Error(err.error?.message ?? 'OpenAI stream failed');
    }
    await parseOpenAIStream(res, onChunk);
  }

  private _fetch(path: string, config: ProviderConfig, init: RequestInit) {
    return fetch(`${OPENAI_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    });
  }
}
