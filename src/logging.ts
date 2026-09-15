import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

export type LogSink = (record: Record<string, string | number>) => void;
export const jsonLog: LogSink = record => console.log(JSON.stringify(record));

// Allowlist only: never serialize requests, errors, URLs, headers, bodies or draft IDs.
export function requestLogging(sink: LogSink): RequestHandler {
  return (request, response, next) => {
    const started = performance.now();
    const requestId = randomUUID();
    response.setHeader('X-Request-ID', requestId);
    response.once('finish', () => sink({
      event: 'http_request', requestId,
      method: request.method,
      route: typeof request.route?.path === 'string' ? request.route.path : 'unmatched',
      status: response.statusCode,
      durationMs: Math.round(performance.now() - started),
    }));
    next();
  };
}
