/**
 * src/providers/gemini.ts
 * Google Gemini provider via Generative Language REST API.
 */

import {
  AIProvider, ProviderConfig, CompletionRequest, CompletionResponse,
  ChatRequest, ChatResponse, ModelInfo, buildFimPrompt, cleanCompletion
} from './base';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const KNOWN_MODELS: ModelInfo[] = [
  { id: 'gemini-2.0-flash',         name: 'Gemini 2.0 Flash',        contextWindow: 1048576 },
  { id: 'gemini-2.0-flash-lite',    name: 'Gemini 2.0 Flash Lite',   contextWindow: 1048576 },
  { id: 'gemini-1.5-pro',           name: 'Gemini 1.5 Pro',          contextWindow: 2097152 },
  { id: 'gemini-1.5-flash',         name: 'Gemini 1.5 Flash',        contextWindow: 1048576 },
];

export class GeminiProvider implements AIProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';
  readonly requiresApiKey = true;

  async validate(config: ProviderConfig): Promise<void> {
    if (!config.apiKey?.trim()) {
      throw new Error('Gemini API key is required. Get one at https://aistudio.google.com/app/apikey');
    }
    const model = config.model || KNOWN_MODELS[0].id;
    const url = `${GEMINI_BASE}/models/${model}?key=${config.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as any;
      throw new Error(`Gemini key validation failed: ${body.error?.message ?? res.statusText}`);
    }
  }

  async listModels(config: ProviderConfig): Promise<ModelInfo[]> {
    try {
      const url = `${GEMINI_BASE}/models?key=${config.apiKey}&pageSize=50`;
      const res = await fetch(url);
      if (!res.ok) { return KNOWN_MODELS; }
      const data = await res.json() as { models: { name: string; displayName: string }[] };
      return data.models
        .filter(m => m.name.includes('gemini'))
        .map(m => ({
          id: m.name.replace('models/', ''),
          name: m.displayName || m.name,
        }));
    } catch {
      return KNOWN_MODELS;
    }
  }

  async complete(req: CompletionRequest, config: ProviderConfig): Promise<CompletionResponse> {
    const model = config.model || KNOWN_MODELS[0].id;
    const prompt = buildFimPrompt(req);
    const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${config.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: req.maxTokens, temperature: req.temperature },
        systemInstruction: { parts: [{ text: 'You are an expert code completion engine. Output ONLY the code — no explanation.' }] },
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) { throw new Error(data.error?.message ?? 'Gemini completion failed'); }
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return { text: cleanCompletion(raw, req.prefix), finishReason: data.candidates?.[0]?.finishReason };
  }

  async chat(req: ChatRequest, config: ProviderConfig): Promise<ChatResponse> {
    const model = config.model || KNOWN_MODELS[0].id;
    const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${config.apiKey}`;
    const { systemText, contents } = this._mapMessages(req.messages);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: req.maxTokens, temperature: req.temperature },
        systemInstruction: systemText ? { parts: [{ text: systemText }] } : undefined,
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) { throw new Error(data.error?.message ?? 'Gemini chat failed'); }
    return { text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '', finishReason: data.candidates?.[0]?.finishReason };
  }

  async chatStream(
    req: ChatRequest,
    config: ProviderConfig,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const model = config.model || KNOWN_MODELS[0].id;
    const url = `${GEMINI_BASE}/models/${model}:streamGenerateContent?key=${config.apiKey}&alt=sse`;
    const { systemText, contents } = this._mapMessages(req.messages);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: req.maxTokens, temperature: req.temperature },
        systemInstruction: systemText ? { parts: [{ text: systemText }] } : undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new Error(err.error?.message ?? 'Gemini stream failed');
    }
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
          try {
            const event = JSON.parse(line.slice(6));
            const text = event.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) { onChunk(text); }
          } catch { /* skip */ }
        }
      }
    }
  }

  private _mapMessages(messages: ChatRequest['messages']) {
    const systemMsg = messages.find(m => m.role === 'system');
    const rest = messages.filter(m => m.role !== 'system');
    const contents = rest.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    return { systemText: systemMsg?.content, contents };
  }
}
