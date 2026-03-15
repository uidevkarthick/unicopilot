/**
 * src/providers/openrouter.ts
 * OpenRouter provider — unified access to 200+ models via a single API.
 * Website: https://openrouter.ai
 */

import {
  AIProvider,
  ProviderConfig,
  CompletionRequest,
  CompletionResponse,
  ChatRequest,
  ChatResponse,
  ModelInfo,
  buildFimPrompt,
  cleanCompletion,
} from './base';

interface OpenRouterModel {
  id: string;
  name: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export class OpenRouterProvider implements AIProvider {
  readonly id = 'openrouter';
  readonly name = 'OpenRouter';
  readonly requiresApiKey = true;

  async validate(config: ProviderConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('OpenRouter API key is required. Get one at https://openrouter.ai/keys');
    }

    // Test with a simple request
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://github.com/unicopilot/unicopilot',
        'X-Title': 'UniCopilot',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter validation failed: ${response.status} - ${error}`);
    }
  }

  async listModels(config: ProviderConfig): Promise<ModelInfo[]> {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://github.com/unicopilot/unicopilot',
        'X-Title': 'UniCopilot',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch OpenRouter models: ${response.statusText}`);
    }

    const json: any = await response.json();
    const models = json.data as OpenRouterModel[];

    // Return popular coding models first
    return models
      .filter(m => m.id && m.name)
      .map(m => ({
        id: m.id,
        name: m.name,
        contextWindow: m.context_length,
        description: m.pricing 
          ? `$${m.pricing.prompt}/1M prompt tokens, $${m.pricing.completion}/1M completion tokens`
          : undefined,
      }))
      .sort((a, b) => {
        // Prioritize popular coding models
        const codingModels = ['claude', 'gpt-4', 'deepseek', 'qwen', 'codellama', 'gemini'];
        const aScore = codingModels.some(k => a.id.toLowerCase().includes(k)) ? 0 : 1;
        const bScore = codingModels.some(k => b.id.toLowerCase().includes(k)) ? 0 : 1;
        return aScore - bScore;
      });
  }

  async complete(request: CompletionRequest, config: ProviderConfig): Promise<CompletionResponse> {
    if (!config.model) {
      throw new Error('No model selected. Please run "UniCopilot: Switch Model" first.');
    }

    // Build FIM prompt
    const prompt = buildFimPrompt(request);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://github.com/unicopilot/unicopilot',
        'X-Title': 'UniCopilot',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert code completion assistant. Complete the code concisely. Output ONLY the completion code, no explanation.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter completion failed: ${response.status} - ${error}`);
    }

    const json: any = await response.json();
    const rawText = json.choices?.[0]?.message?.content ?? '';
    const cleaned = cleanCompletion(rawText, request.prefix);

    return {
      text: cleaned,
      finishReason: json.choices?.[0]?.finish_reason,
    };
  }

  async chat(request: ChatRequest, config: ProviderConfig): Promise<ChatResponse> {
    if (!config.model) {
      throw new Error('No model selected. Please run "UniCopilot: Switch Model" first.');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://github.com/unicopilot/unicopilot',
        'X-Title': 'UniCopilot',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: request.messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter chat failed: ${response.status} - ${error}`);
    }

    const json: any = await response.json();
    return {
      text: json.choices?.[0]?.message?.content ?? '',
      finishReason: json.choices?.[0]?.finish_reason,
    };
  }

  async chatStream(
    request: ChatRequest,
    config: ProviderConfig,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    if (!config.model) {
      throw new Error('No model selected. Please run "UniCopilot: Switch Model" first.');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://github.com/unicopilot/unicopilot',
        'X-Title': 'UniCopilot',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: request.messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter stream failed: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          
          try {
            const json: any = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}
