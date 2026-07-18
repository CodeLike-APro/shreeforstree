/**
 * Awaitable stand-in for a Drizzle query-builder chain: every method call
 * returns the same chain, and awaiting it (at any depth) resolves to `result`.
 */
export function chain(result: unknown = []) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const target: any = () => {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proxy: any = new Proxy(target, {
    get(_t, prop) {
      if (prop === "then") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (resolve: any, reject: any) =>
          Promise.resolve(result).then(resolve, reject);
      }
      return () => proxy;
    },
    apply() {
      return proxy;
    },
  });
  return proxy;
}

export function jsonRequest(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
