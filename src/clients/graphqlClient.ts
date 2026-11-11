import { APIRequestContext, expect } from '@playwright/test';

export interface GraphQLError {
  message: string;
  path?: (string | number)[];
  extensions?: { code?: string; [k: string]: unknown };
}

export interface GraphQLResponse<T> {
  status: number;
  data: T | null;
  errors?: GraphQLError[];
  durationMs: number;
}

/**
 * Thin GraphQL client over Playwright's APIRequestContext.
 * GraphQL usually returns HTTP 200 even on failure, so callers get the
 * `errors` array back explicitly and `queryOk` asserts it is absent.
 */
export class GraphQLClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly url: string,
    private readonly headers: Record<string, string> = {},
  ) {}

  async query<T = unknown>(
    query: string,
    variables: Record<string, unknown> = {},
    operationName?: string,
  ): Promise<GraphQLResponse<T>> {
    const started = Date.now();
    const res = await this.request.post(this.url, {
      headers: { 'Content-Type': 'application/json', ...this.headers },
      data: { query, variables, operationName },
    });
    const durationMs = Date.now() - started;
    const body = await res.json().catch(() => ({}));
    return { status: res.status(), data: body.data ?? null, errors: body.errors, durationMs };
  }

  /** Run a query and fail the test if HTTP != 200 or any GraphQL error is returned. */
  async queryOk<T = unknown>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await this.query<T>(query, variables);
    expect(res.status, 'HTTP status').toBe(200);
    expect(res.errors, `GraphQL errors: ${JSON.stringify(res.errors)}`).toBeUndefined();
    expect(res.data).not.toBeNull();
    return res.data as T;
  }
}
