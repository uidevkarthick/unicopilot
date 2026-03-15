/**
 * src/providers/ollama.ts
 * Local Ollama provider — no API key required.
 * Supports any model pulled via `ollama pull <model>`.
 */

import {
  AIProvider, ProviderConfig, CompletionRequest, CompletionResponse,
  ChatRequest, ChatResponse, ModelInfo, buildFimPrompt, cleanCompletion
} from './base';

export class OllamaProvider implements AIProvider {
  readonly id = 'ollama';
  readonly name = 'Ollama (Local)';
  readonly requiresApiKey = false;

  private _base(config: ProviderConfig): string {
    return (config.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
  }

  async validate(config: ProviderConfig): Promise<void> {
    const base = this._base(config);
    try {
      const res = await fetch(`${base}/api/tags`);
      if (!res.ok) { throw new Error(`Ollama returned ${res.status}`); }
    } catch (e: any) {
      throw new Error(
        `Cannot reach Ollama at ${base}. Make sure Ollama is running: https://ollama.com\n${e.message}`
      );
    }
  }

  async listModels(config: ProviderConfig): Promise<ModelInfo[]> {
    const base = this._base(config);
    try {
      const res = await fetch(`${base}/api/tags`);
      if (!res.ok) { return []; }
      const data = await res.json() as { models: { name: string; details?: { parameter_size?: string } }[] };
      return data.models.map(m => ({
        id: m.name,
        name: m.name,
        description: m.details?.parameter_size ? `${m.details.parameter_size} parameters` : undefined,
      }));
    } catch {
      return [];
    }
  }

  async complete(req: CompletionRequest, config: ProviderConfig): Promise<CompletionResponse> {
    const base = this._base(config);
    const model = config.model || 'codellama';

    // Use native FIM endpoint if available (codellama, deepseek-coder, etc.)
    const isFimModel = /codellama|deepseek|starcoder|codegemma|qwen.*coder/i.test(model);

    if (isFimModel) {
      const res = await fetch(`${base}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: req.prefix,
          suffix: req.suffix,
          options: { temperature: req.temperature, num_predict: req.maxTokens },
          stream: false,
        }),
      });
      const data = await res.json() as any;
      if (!res.ok) { throw new Error(data.error ?? 'Ollama completion failed'); }
      return { text: cleanCompletion(data.response, req.prefix) };
    }

    // Fallback: chat-style FIM prompt
    const prompt = buildFimPrompt(req);
    const res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        options: { temperature: req.temperature, num_predict: req.maxTokens },
        stream: false,
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) { throw new Error(data.error ?? 'Ollama completion failed'); }
    return { text: cleanCompletion(data.response, req.prefix) };
  }

  async chat(req: ChatRequest, config: ProviderConfig): Promise<ChatResponse> {
    const base = this._base(config);
    const model = config.model || 'llama3.2';
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: req.messages,
        options: { temperature: req.temperature, num_predict: req.maxTokens },
        stream: false,
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) { throw new Error(data.error ?? 'Ollama chat failed'); }
    return { text: data.message?.content ?? '' };
  }

  async chatStream(
    req: ChatRequest,
    config: ProviderConfig,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const base = this._base(config);
    const model = config.model || 'llama3.2';
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: req.messages,
        options: { temperature: req.temperature, num_predict: req.maxTokens },
        stream: true,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new Error(err.error ?? 'Ollama stream failed');
    }
    const reader = res.body?.getReader();
    if (!reader) { return; }
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) { break; }
      const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          if (event.message?.content) { onChunk(event.message.content); }
        } catch { /* skip */ }
      }
    }
  }
}
