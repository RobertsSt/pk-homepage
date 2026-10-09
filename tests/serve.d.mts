import type { IncomingMessage, ServerResponse } from 'node:http';

/** Answers one request from dist/. */
export function serve(request: IncomingMessage, response: ServerResponse): void;
