/**
 * CALLBACX MARKETING — Retry and rate-limit handling
 *
 * Generic retry with exponential backoff + jitter for provider calls that
 * fail transiently, and explicit handling of HTTP 429 / Retry-After.
 *
 * Provider SDKs (Resend, Stripe, Meta, TikTok, Google) each surface rate
 * limit errors differently, so callers pass a `retryable` predicate and an
 * optional `retryAfter` extractor.
 */

export type RetryablePredicate = (error: unknown) => boolean;
export type RetryAfterExtractor = (error: unknown) => number | undefined;

export interface RetryOptions {
  /** Maximum number of attempts (default 3). */
  attempts?: number;
  /** Base delay in ms (default 1000). */
  minTimeout?: number;
  /** Maximum delay in ms (default 30000). */
  maxTimeout?: number;
  /** Called before each retry with (error, attempt, nextDelayMs). */
  onRetry?: (error: unknown, attempt: number, nextDelayMs: number) => void;
  /** Predicate to decide whether an error is retryable. */
  retryable?: RetryablePredicate;
  /** Extract Retry-After seconds from a rate-limit error. */
  retryAfter?: RetryAfterExtractor;
}

/**
 * Default retryable predicate: true for 429, 502, 503, 504 and network
 * timeouts. Callers should override for provider-specific error shapes.
 */
export function defaultRetryable(error: unknown): boolean {
  if (error == null) return false;

  // Fetch-style errors
  if (typeof error === "object" && "status" in error) {
    const status = Number((error as { status?: unknown }).status);
    return status === 429 || status === 502 || status === 503 || status === 504;
  }

  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504") ||
    message.includes("etimedout") ||
    message.includes("econnrefused") ||
    message.includes("socket hang up") ||
    message.includes("network error")
  );
}

export function defaultRetryAfter(error: unknown): number | undefined {
  if (error == null || typeof error !== "object") return undefined;

  // Fetch-style headers
  const headers = (error as { headers?: Record<string, string> | Headers }).headers;
  if (headers) {
    const headerMap =
      "get" in headers
        ? (headers as Headers)
        : (headers as Record<string, string>);
    const header =
      headerMap instanceof Headers
        ? headerMap.get("retry-after") ?? headerMap.get("Retry-After")
        : headerMap["retry-after"] ?? headerMap["Retry-After"];
    if (header) {
      const seconds = Number(header);
      if (Number.isFinite(seconds)) return seconds;
    }
  }

  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  const match = message.match(/retry.?after.?:\s*(\d+)/i);
  if (match) return Number(match[1]);

  return undefined;
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Jittered exponential backoff: base * 2^(attempt-1) + random [0, base].
 */
function backoffMs(attempt: number, base: number, cap: number): number {
  const exponential = Math.min(base * Math.pow(2, attempt - 1), cap);
  return exponential + Math.floor(Math.random() * base);
}

/**
 * Run `fn` with retries. Throws the last error if all attempts fail.
 * On a 429 / rate-limited error, respects Retry-After when available.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    attempts = 3,
    minTimeout = 1000,
    maxTimeout = 30000,
    onRetry,
    retryable = defaultRetryable,
    retryAfter = defaultRetryAfter,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === attempts || !retryable(error)) {
        throw error;
      }

      const suggested = retryAfter(error);
      const delayMs = suggested != null ? suggested * 1000 : backoffMs(attempt, minTimeout, maxTimeout);

      onRetry?.(error, attempt, delayMs);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

/**
 * In-memory token bucket rate limiter (per serverless instance).
 * Useful as a coarse local guard before calling a provider; provider-side
 * 429 handling via withRetry remains the authoritative backoff.
 */
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    public readonly capacity: number,
    public readonly refillPerSecond: number
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume one token. Returns the delay (ms) to wait if the bucket
   * is empty, or 0 if the token was consumed.
   */
  consume(): number {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return 0;
    }
    const deficit = 1 - this.tokens;
    return Math.ceil((deficit / this.refillPerSecond) * 1000);
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerSecond);
    this.lastRefill = now;
  }
}
