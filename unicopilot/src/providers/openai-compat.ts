/**
 * src/providers/openai-compat.ts
 * Generic OpenAI-compatible provider.
 * Works with: OpenAI, Together AI, Groq, Mistral, LM Studio, llama.cpp server,
 * text-generation-webui, vLLM, and any other OpenAI-spec endpoint.
 */

import {
  AIProvider, ProviderConfig, CompletionRequest, CompletionResponse,
  ChatRequest, ChatResponse, ModelInfo, buildFimPrompt, cleanCompletion
} from './base';
import { parseOpenAIStream } from './nvidia-nim';

export class OpenAICompatProvider implements AIProvider {
  readonly id = 'openai-compat';
  readonly name = 'Custom (OpenAI-Compatible)';
  readonly requiresApiKey = false; // Optional — some local servers don't need one

  private _base(config: ProviderConfig): string {
    return (config.baseUrl || 'http://localhost:1234/v1').replace(/\/$/, '');
  }

  async validate(config: ProviderConfig): Promise<void> {
    const base = this._base(config);
    try {
      const res = await this._fetch('/models', config, { method: 'GET' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as any;
        throw new Error(body.error?.message ?? `Server returned ${res.status}`);
      }
    } catch (e: any) {
      throw new Error(`Cannot reach custom provider at ${base}.\n${e.message}`);
    }
  }

  async listModels(config: ProviderConfig): Promise<ModelInfo[]> {
    try {
      const res = await this._fetch('/models', config, { method: 'GET' });
      if (!res.ok) { return []; }
      const data = await res.json() as { data: { id: string; owned_by?: string }[] };
      return (data.data ?? []).map(m => ({ id: m.id, name: m.id }));
    } catch {
      return [];
    }
  }

  async complete(req: CompletionRequest, config: ProviderConfig): Promise<CompletionResponse> {
    const prompt = buildFimPrompt(req);
    const model = config.model || 'gpt-3.5-turbo';

    // Try chat/completions (works everywhere)
    const res = await this._fetch('/chat/completions', config, {
      method: 'POST',
      body: JSON.stringify({
        model,
        max_tokens: req.maxTokens,
        temperature: req.temperature,
        messages: [
          { role: 'system', content: 'You are an expert code completion engine. Output ONLY the code — no explanation, no markdown.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) { throw new Error(data.error?.message ?? 'Custom provider completion failed'); }
    const raw = data.choices?.[0]?.message?.content ?? '';
    return { text: cleanCompletion(raw, req.prefix), finishReason: data.choices?.[0]?.finish_reason };
  }

  async chat(req: ChatRequest, config: ProviderConfig): Promise<ChatResponse> {
    const res = await this._fetch('/chat/completions', config, {
      method: 'POST',
      body: JSON.stringify({
        model: config.model || 'gpt-3.5-turbo',
        max_tokens: req.maxTokens,
        temperature: req.temperature,
        messages: req.messages,
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) { throw new Error(data.error?.message ?? 'Custom provider chat failed'); }
    return { text: data.choices?.[0]?.message?.content ?? '', finishReason: data.choices?.[0]?.finish_reason };
  }

  async chatStream(
    req: ChatRequest,
    config: ProviderConfig,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const res = await this._fetch('/chat/completions', config, {
      method: 'POST',
      body: JSON.stringify({
        model: config.model || 'gpt-3.5-turbo',
        max_tokens: req.maxTokens,
        temperature: req.temperature,
        messages: req.messages,
        stream: true,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new Error(err.error?.message ?? 'Custom provider stream failed');
    }
    await parseOpenAIStream(res, onChunk);
  }

  private _fetch(path: string, config: ProviderConfig, init: RequestInit) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.apiKey?.trim()) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
    return fetch(`${this._base(config)}${path}`, { ...init, headers });
  }
}
