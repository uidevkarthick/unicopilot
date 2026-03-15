/**
 * src/utils/token-tracker.ts
 * Track token usage across providers and sessions.
 */

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  provider: string;
  timestamp: number;
}

export interface SessionStats {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  requestCount: number;
  estimatedCost: number;
}

export class TokenTracker {
  private usage: TokenUsage[] = [];
  private readonly MAX_HISTORY = 1000; // Keep last 1000 requests

  /**
   * Record token usage for a request
   */
  track(usage: TokenUsage): void {
    this.usage.push(usage);
    
    // Keep only recent history
    if (this.usage.length > this.MAX_HISTORY) {
      this.usage.shift();
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): SessionStats {
    const stats = this.usage.reduce(
      (acc, curr) => {
        acc.totalPromptTokens += curr.promptTokens;
        acc.totalCompletionTokens += curr.completionTokens;
        acc.totalTokens += curr.totalTokens;
        acc.requestCount++;
        return acc;
      },
      {
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        requestCount: 0,
        estimatedCost: 0,
      }
    );

    // Calculate estimated cost
    stats.estimatedCost = this.calculateTotalCost();

    return stats;
  }

  /**
   * Get stats for a specific provider
   */
  getProviderStats(provider: string): SessionStats {
    const filtered = this.usage.filter(u => u.provider === provider);
    const stats = filtered.reduce(
      (acc, curr) => {
        acc.totalPromptTokens += curr.promptTokens;
        acc.totalCompletionTokens += curr.completionTokens;
        acc.totalTokens += curr.totalTokens;
        acc.requestCount++;
        return acc;
      },
      {
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        requestCount: 0,
        estimatedCost: 0,
      }
    );

    // Calculate cost for this provider
    stats.estimatedCost = this.calculateProviderCost(provider);

    return stats;
  }

  /**
   * Get stats for a specific model
   */
  getModelStats(model: string): SessionStats {
    const filtered = this.usage.filter(u => u.model === model);
    return filtered.reduce(
      (acc, curr) => {
        acc.totalPromptTokens += curr.promptTokens;
        acc.totalCompletionTokens += curr.completionTokens;
        acc.totalTokens += curr.totalTokens;
        acc.requestCount++;
        return acc;
      },
      {
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        requestCount: 0,
        estimatedCost: 0,
      }
    );
  }

  /**
   * Get usage history
   */
  getHistory(limit?: number): TokenUsage[] {
    if (limit) {
      return this.usage.slice(-limit);
    }
    return [...this.usage];
  }

  /**
   * Clear all tracking data
   */
  clear(): void {
    this.usage = [];
  }

  /**
   * Calculate total estimated cost
   */
  private calculateTotalCost(): number {
    return this.usage.reduce((total, usage) => {
      return total + this.estimateCost(usage);
    }, 0);
  }

  /**
   * Calculate cost for a specific provider
   */
  private calculateProviderCost(provider: string): number {
    return this.usage
      .filter(u => u.provider === provider)
      .reduce((total, usage) => {
        return total + this.estimateCost(usage);
      }, 0);
  }

  /**
   * Estimate cost for a single usage entry
   * Prices are approximate and based on popular models
   */
  private estimateCost(usage: TokenUsage): number {
    const { provider, model, promptTokens, completionTokens } = usage;

    // Prices per 1M tokens (approximate)
    const pricing: Record<string, { prompt: number; completion: number }> = {
      // OpenAI
      'gpt-4': { prompt: 30, completion: 60 },
      'gpt-4-turbo': { prompt: 10, completion: 30 },
      'gpt-4o': { prompt: 5, completion: 15 },
      'gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
      'gpt-3.5-turbo': { prompt: 0.5, completion: 1.5 },
      
      // Anthropic
      'claude-3-opus': { prompt: 15, completion: 75 },
      'claude-3-5-sonnet': { prompt: 3, completion: 15 },
      'claude-3-sonnet': { prompt: 3, completion: 15 },
      'claude-3-haiku': { prompt: 0.25, completion: 1.25 },
      
      // Google
      'gemini-1.5-pro': { prompt: 1.25, completion: 5 },
      'gemini-1.5-flash': { prompt: 0.075, completion: 0.3 },
      'gemini-2.0-flash': { prompt: 0.075, completion: 0.3 },
      
      // Default for unknown models
      'default': { prompt: 1, completion: 2 },
    };

    // Find matching pricing
    let modelPricing = pricing['default'];
    for (const [key, value] of Object.entries(pricing)) {
      if (model.toLowerCase().includes(key.toLowerCase())) {
        modelPricing = value;
        break;
      }
    }

    // Local models are free
    if (provider === 'ollama') {
      return 0;
    }

    // Calculate cost
    const promptCost = (promptTokens / 1_000_000) * modelPricing.prompt;
    const completionCost = (completionTokens / 1_000_000) * modelPricing.completion;

    return promptCost + completionCost;
  }

  /**
   * Format cost as USD string
   */
  static formatCost(cost: number): string {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return '<$0.01';
    return `$${cost.toFixed(2)}`;
  }

  /**
   * Estimate tokens in text (rough approximation)
   * 1 token ≈ 4 characters for English text
   */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

// Global singleton instance
export const globalTokenTracker = new TokenTracker();
