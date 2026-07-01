/**
 * HTTP adapter interface (Port).
 * Abstracts the HTTP client implementation behind an interface.
 * The shared core uses this interface; platform adapters provide implementations.
 */
export interface IHTTPAdapter {
  /**
   * Make an HTTP request.
   * @param url - Full URL to request
   * @param options - Request options (method, headers, body, signal)
   * @returns Response with status, headers, and body text
   */
  request(url: string, options: RequestOptions): Promise<HTTPResponse>;
}

/**
 * HTTP request options.
 */
export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string> | null;
  body?: string | null;
  signal?: AbortSignal | null;
}

/**
 * HTTP response.
 */
export interface HTTPResponse {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly body: string;
}

/**
 * Fetch-based HTTP adapter using native fetch.
 * Zero additional dependencies.
 */
export class FetchAdapter implements IHTTPAdapter {
  async request(url: string, options: RequestOptions): Promise<HTTPResponse> {
    const fetchOptions: RequestInit = {
      method: options.method,
    };
    if (options.headers !== null && options.headers !== undefined) {
      fetchOptions.headers = options.headers;
    }
    if (options.body !== null && options.body !== undefined) {
      fetchOptions.body = options.body;
    }
    if (options.signal !== null && options.signal !== undefined) {
      fetchOptions.signal = options.signal;
    }

    const response = await fetch(url, fetchOptions);

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const body = await response.text();

    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      body,
    };
  }
}
