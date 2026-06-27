// API Client — barrel exports
export type { IFireflyIIIClient, TransactionQueryParams } from './firefly-client.js';
export { FireflyIIIClient } from './firefly-client-impl.js';
export { HTTPSEnforcer } from './https-enforcer.js';
export { TimeoutController } from './timeout-controller.js';
export { AuthGate } from './auth-gate.js';
export { RetryMiddleware } from './retry-middleware.js';
export type { IHTTPAdapter, RequestOptions, HTTPResponse } from './adapters/fetch-adapter.js';
export { FetchAdapter } from './adapters/fetch-adapter.js';
