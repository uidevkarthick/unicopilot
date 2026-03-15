/**
 * src/providers/nvidia-nim.ts
 * NVIDIA NIM provider — OpenAI-compatible API hosted on api.nvidia.com
 */

import {
  AIProvider, ProviderConfig, CompletionRequest, CompletionResponse,
  ChatRequest, ChatResponse, ModelInfo, buildFimPrompt, cleanCompletion
} from './base';

const NIM_BASE = 'https://integrate.api.nvidia.com/v1';

const KNOWN_MODELS: ModelInfo[] = [
  { id: 'meta/llama-3.3-70b-instruct',         name: 'Llama 3.3 70B Instruct' },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B Instruct' },
  { id: 'mistralai/mistral-large',             name: 'Mistral Large' },
  { id: 'google/gemma-2-27b-it',               name: 'Gemma 2 27B' },
  { id: 'deepseek-ai/deepseek-r1',             name: 'DeepSeek R1' },
  { id: 'qwen/qwen2.5-coder-32b-instruct',     name: 'Qwen 2.5 Coder 32B' },
];

export class NvidiaNimProvider implements AIProvider {
  readonly id = 'nvidia-nim';
  readonly name = 'NVIDIA NIM';
  readonly requiresApiKey = true;

  async validate(config: ProviderConfig): Promise<void> {
    if (!config.apiKey?.trim()) {
      throw new Error('NVIDIA NIM API key required. Get one at https://build.nvidia.com');
    }
    const res = await this._fetch('/models', config, { method: 'GET' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as any;
      throw new Error(`NVIDIA NIM key validation failed: ${body.message ?? res.statusText}`);
    }
  }

  async listModels(config: ProviderConfig): Promise<ModelInfo[]> {
    try {
      const res = await this._fetch('/models', config, { method: 'GET' });
      if (!res.ok) { return KNOWN_MODELS; }
      const data = await res.json() as { data: { id: string }[] };
      return data.data.map(m => ({
        id: m.id,
        name: KNOWN_MODELS.find(k => k.id === m.id)?.name ?? m.id,
      }));
    } catch {
      return KNOWN_MODELS;
    }
  }

  async complete(req: CompletionRequest, config: ProviderConfig): Promise<CompletionResponse> {
    const prompt = buildFimPrompt(req);
    const res = await this._fetch('/chat/completions', config, {
      method: 'POST',
      body: JSON.stringify({
        model: config.model || KNOWN_MODELS[3].id,
        max_tokens: req.maxTokens,
        temperature: req.temperature,
        messages: [
          { role: 'system', content: 'You are an expert code completion engine. Output ONLY the code — no explanation.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) { throw new Error(data.message ?? 'NVIDIA NIM completion failed'); }
    const raw = data.choices?.[0]?.message?.content ?? '';
    return { text: cleanCompletion(raw, req.prefix), finishReason: data.choices?.[0]?.finish_reason };
  }

  async chat(req: ChatRequest, config: ProviderConfig): Promise<ChatResponse> {
    const res = await this._fetch('/chat/completions', config, {
      method: 'POST',
      body: JSON.stringify({
        model: config.model || KNOWN_MODELS[0].id,
        max_tokens: req.maxTokens,
        temperature: req.temperature,
        messages: req.messages,
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) { throw new Error(data.message ?? 'NVIDIA NIM chat failed'); }
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
        model: config.model || KNOWN_MODELS[0].id,
        max_tokens: req.maxTokens,
        temperature: req.temperature,
        messages: req.messages,
        stream: true,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new Error(err.message ?? 'NVIDIA NIM stream failed');
    }
    await parseOpenAIStream(res, onChunk);
  }

  private _fetch(path: string, config: ProviderConfig, init: RequestInit) {
    return fetch(`${NIM_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    });
  }
}

export async function parseOpenAIStream(res: Response, onChunk: (text: string) => void) {
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
      if (!line.startsWith('data: ')) { continue; }
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') { return; }
      try {
        const event = JSON.parse(payload);
        const delta = event.choices?.[0]?.delta?.content;
        if (delta) { onChunk(delta); }
      } catch { /* skip */ }
    }
  }
}
