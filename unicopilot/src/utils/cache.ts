/**
 * src/utils/cache.ts
 * Simple in-memory cache with TTL for API responses.
 */

interface CacheEntry<T> {
  data: T;
  expires: number;
}

export class Cache<T> {
  private readonly _ttlMs: number;
  private readonly _map = new Map<string, CacheEntry<T>>();

  constructor(ttlSeconds: number = 300) {
    this._ttlMs = ttlSeconds * 1000;
  }

  get(key: string): T | undefined {
    const entry = this._map.get(key);
    if (!entry) { return undefined; }
    if (Date.now() > entry.expires) {
      this._map.delete(key);
      return undefined;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this._map.set(key, {
      data,
      expires: Date.now() + this._ttlMs,
    });
  }

  clear(): void {
    this._map.clear();
  }

  delete(key: string): boolean {
    return this._map.delete(key);
  }
}
