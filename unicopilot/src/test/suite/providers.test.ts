/**
 * src/test/suite/providers.test.ts
 * Unit tests for provider utilities — no network calls needed.
 */

import * as assert from 'assert';
import { buildFimPrompt, cleanCompletion } from '../../providers/base';
import { OllamaProvider } from '../../providers/ollama';
import { AnthropicProvider } from '../../providers/anthropic';
import { GeminiProvider } from '../../providers/gemini';
import { NvidiaNimProvider } from '../../providers/nvidia-nim';
import { OpenAICompatProvider } from '../../providers/openai-compat';

suite('Provider: base utilities', () => {
  test('buildFimPrompt includes prefix, suffix, language', () => {
    const prompt = buildFimPrompt({
      prefix: 'function add(',
      suffix: ') {}',
      language: 'typescript',
      filename: 'math.ts',
      maxTokens: 100,
      temperature: 0.2,
    });
    assert.ok(prompt.includes('function add('));
    assert.ok(prompt.includes(') {}'));
    assert.ok(prompt.includes('typescript'));
    assert.ok(prompt.includes('math.ts'));
    assert.ok(prompt.includes('<FILL_HERE>'));
  });

  test('cleanCompletion strips markdown fences', () => {
    const raw = '```typescript\nconst x = 1;\n```';
    const cleaned = cleanCompletion(raw, '');
    assert.strictEqual(cleaned, 'const x = 1;');
  });

  test('cleanCompletion strips echoed prefix', () => {
    const prefix = 'function add(';
    const raw = 'function add(a: number, b: number): number';
    const cleaned = cleanCompletion(raw, prefix);
    assert.ok(!cleaned.startsWith(prefix.trim()));
  });

  test('cleanCompletion handles empty response', () => {
    assert.strictEqual(cleanCompletion('', 'prefix'), '');
  });
});

suite('Provider: metadata', () => {
  test('OllamaProvider has correct id and no apiKey requirement', () => {
    const p = new OllamaProvider();
    assert.strictEqual(p.id, 'ollama');
    assert.strictEqual(p.requiresApiKey, false);
  });

  test('AnthropicProvider requires API key', () => {
    const p = new AnthropicProvider();
    assert.strictEqual(p.id, 'anthropic');
    assert.strictEqual(p.requiresApiKey, true);
  });

  test('GeminiProvider requires API key', () => {
    const p = new GeminiProvider();
    assert.strictEqual(p.id, 'gemini');
    assert.strictEqual(p.requiresApiKey, true);
  });

  test('NvidiaNimProvider requires API key', () => {
    const p = new NvidiaNimProvider();
    assert.strictEqual(p.id, 'nvidia-nim');
    assert.strictEqual(p.requiresApiKey, true);
  });

  test('OpenAICompatProvider does not require API key', () => {
    const p = new OpenAICompatProvider();
    assert.strictEqual(p.id, 'openai-compat');
    assert.strictEqual(p.requiresApiKey, false);
  });
});

suite('Provider: Ollama URL resolution', () => {
  test('uses default localhost URL when no baseUrl configured', () => {
    const p = new OllamaProvider();
    // Access private method via type cast for testing
    const base = (p as any)._base({ model: '' });
    assert.strictEqual(base, 'http://localhost:11434');
  });

  test('uses custom baseUrl when provided', () => {
    const p = new OllamaProvider();
    const base = (p as any)._base({ baseUrl: 'http://192.168.1.10:11434', model: '' });
    assert.strictEqual(base, 'http://192.168.1.10:11434');
  });

  test('strips trailing slash from baseUrl', () => {
    const p = new OllamaProvider();
    const base = (p as any)._base({ baseUrl: 'http://localhost:11434/', model: '' });
    assert.strictEqual(base, 'http://localhost:11434');
  });
});

suite('Provider: validate rejects missing keys', () => {
  test('AnthropicProvider throws on empty API key', async () => {
    const p = new AnthropicProvider();
    await assert.rejects(
      () => p.validate({ apiKey: '', model: 'claude-3-haiku-20240307' }),
      /API key is required/
    );
  });

  test('GeminiProvider throws on empty API key', async () => {
    const p = new GeminiProvider();
    await assert.rejects(
      () => p.validate({ apiKey: '  ', model: 'gemini-1.5-flash' }),
      /API key is required/
    );
  });

  test('NvidiaNimProvider throws on empty API key', async () => {
    const p = new NvidiaNimProvider();
    await assert.rejects(
      () => p.validate({ apiKey: '', model: 'meta/llama-3.3-70b-instruct' }),
      /API key required/
    );
  });
});
