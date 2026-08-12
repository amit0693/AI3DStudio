export interface D1Call {
  sql: string;
  values: unknown[];
}

interface Responder {
  pattern: RegExp;
  rows: unknown[];
}

export interface D1Fake {
  calls: D1Call[];
  batched: D1Call[][];
  /** Rows returned by `first()` / `all()` for statements matching `pattern`. */
  respond(pattern: RegExp, rows: unknown[]): D1Fake;
  failNextRun(error: Error): D1Fake;
  callsMatching(pattern: RegExp): D1Call[];
  database: {
    prepare(sql: string): D1Statement;
    batch(statements: D1Statement[]): Promise<unknown[]>;
  };
}

interface D1Statement {
  sql: string;
  values: unknown[];
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[]; success: true }>;
  run(): Promise<{ success: true }>;
}

export function createD1Fake(): D1Fake {
  const calls: D1Call[] = [];
  const batched: D1Call[][] = [];
  const responders: Responder[] = [];
  let runError: Error | null = null;

  function rowsFor(sql: string): unknown[] {
    return responders.find((responder) => responder.pattern.test(sql))?.rows ?? [];
  }

  function statement(sql: string, values: unknown[] = []): D1Statement {
    const call: D1Call = { sql, values };

    return {
      sql,
      values,
      bind(...bound: unknown[]) {
        return statement(sql, bound);
      },
      async first<T>() {
        calls.push(call);
        return (rowsFor(sql)[0] as T) ?? null;
      },
      async all<T>() {
        calls.push(call);
        return { results: rowsFor(sql) as T[], success: true as const };
      },
      async run() {
        calls.push(call);
        if (runError) throw runError;
        return { success: true as const };
      },
    };
  }

  const fake: D1Fake = {
    calls,
    batched,
    respond(pattern, rows) {
      responders.push({ pattern, rows });
      return fake;
    },
    failNextRun(error) {
      runError = error;
      return fake;
    },
    callsMatching(pattern) {
      return calls.filter((call) => pattern.test(call.sql));
    },
    database: {
      prepare(sql: string) {
        return statement(sql);
      },
      async batch(statements: D1Statement[]) {
        const group = statements.map(({ sql, values }) => ({ sql, values }));
        batched.push(group);
        calls.push(...group);
        if (runError) throw runError;
        return group.map(() => ({ success: true }));
      },
    },
  };

  return fake;
}
