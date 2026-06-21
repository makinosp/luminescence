/**
 * Timeout Controller.
 * Aborts requests that exceed the timeout threshold using AbortController.
 *
 * NFR Performance §3.4: Default 10 seconds, configurable per-request.
 */
export class TimeoutController {
  private defaultTimeoutMs: number;

  constructor(defaultTimeoutMs = 10_000) {
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  /**
   * Create an AbortSignal that triggers after the specified timeout.
   * @param timeoutMs - Timeout in milliseconds (uses default if not specified)
   * @returns AbortSignal that will be aborted after the timeout
   */
  createSignal(timeoutMs?: number): { signal: AbortSignal; clear: () => void } {
    const controller = new AbortController();
    const timeout = timeoutMs ?? this.defaultTimeoutMs;

    const timer = setTimeout(() => {
      controller.abort(new DOMException(`Request timed out after ${timeout}ms`, 'TimeoutError'));
    }, timeout);

    return {
      signal: controller.signal,
      clear: () => clearTimeout(timer),
    };
  }

  /**
   * Update the default timeout.
   */
  setDefaultTimeout(ms: number): void {
    if (ms <= 0) {
      throw new Error('Timeout must be a positive number');
    }
    this.defaultTimeoutMs = ms;
  }

  /**
   * Get the current default timeout.
   */
  getDefaultTimeout(): number {
    return this.defaultTimeoutMs;
  }
}
