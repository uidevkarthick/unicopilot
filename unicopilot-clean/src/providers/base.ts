/**
 * src/providers/base.ts
 * Abstract interface every AI provider must implement.
 * Adding a new provider = implement this interface, register in registry.ts. Done.
 */

export interface CompletionRequest {
  prefix: string;          // code before cursor
  suffix: string;          // code after cursor
  language: string;        // e.g. "typescript"
  filename: string;
  maxTokens: number;
  temperature: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  maxTokens: number;
  temperature: number;
  stream?: boolean;
}

export interface CompletionResponse {
  text: string;
  finishReason?: string;
}

export interface ChatResponse {
  text: string;
  finishReason?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow?: number;
  description?: string;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model: string;
}

/**
 * Every AI provider implements this interface.
 */
export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly requiresApiKey: boolean;

  /** Validate the current config. Throws descriptive error if invalid. */
  validate(config: ProviderConfig): Promise<void>;

  /** List available models for this provider. */
  listModels(config: ProviderConfig): Promise<ModelInfo[]>;

  /** Single-shot code completion (for inline ghost text). */
  complete(request: CompletionRequest, config: ProviderConfig): Promise<CompletionResponse>;

  /** Multi-turn chat (for sidebar). Yields chunks if stream=true. */
  chat(request: ChatRequest, config: ProviderConfig): Promise<ChatResponse>;

  /** Streaming chat — yields text chunks. */
  chatStream(
    request: ChatRequest,
    config: ProviderConfig,
    onChunk: (chunk: string) => void
  ): Promise<void>;
}

/**
 * Shared helper — build a FIM (Fill-in-Middle) prompt for providers
 * that don't have a native FIM API.
 */
export function buildFimPrompt(req: CompletionRequest): string {
  return [
    `// Language: ${req.language}`,
    `// File: ${req.filename}`,
    `// Complete the code. Output ONLY the completion, no explanation.`,
    ``,
    req.prefix,
    '<FILL_HERE>',
    req.suffix,
  ].join('\n');
}

/**
 * Shared helper — strip common LLM artifacts from completions.
 */
export function cleanCompletion(raw: string, prefix: string): string {
  let text = raw.trim();
  // Remove markdown code fences
  text = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
  // Remove echoed prefix
  if (text.startsWith(prefix.trim())) {
    text = text.slice(prefix.trim().length);
  }
  return text;
}
