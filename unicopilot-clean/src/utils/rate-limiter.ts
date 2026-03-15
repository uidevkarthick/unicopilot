/**
 * src/utils/rate-limiter.ts
 * Simple rate limiter to prevent API throttling.
 */

export class RateLimiter {
  private readonly _minIntervalMs: number;
  private _lastCallTime = 0;

  constructor(minIntervalMs: number = 1000) {
    this._minIntervalMs = minIntervalMs;
  }

  /**
   * Waits if necessary to enforce rate limit, then resolves.
   * Returns the time waited in ms (0 if no wait was needed).
   */
  async acquire(): Promise<number> {
    const now = Date.now();
    const elapsed = now - this._lastCallTime;
    if (elapsed < this._minIntervalMs) {
      const waitTime = this._minIntervalMs - elapsed;
      await this._sleep(waitTime);
      this._lastCallTime = Date.now();
      return waitTime;
    }
    this._lastCallTime = now;
    return 0;
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset(): void {
    this._lastCallTime = 0;
  }
}
