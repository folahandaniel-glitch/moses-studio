import postgres from "postgres";

declare global {
  var __sql: ReturnType<typeof postgres> | undefined;
}

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return postgres(url, { max: 5, idle_timeout: 20, connect_timeout: 15, prepare: false });
}

/** Lazily created so builds and tooling that never touch the database do not fail. */
export const sql = new Proxy(function () {} as unknown as ReturnType<typeof postgres>, {
  get(_t, prop) {
    globalThis.__sql ??= connect();
    return Reflect.get(globalThis.__sql, prop);
  },
  apply(_t, _this, args) {
    globalThis.__sql ??= connect();
    return (globalThis.__sql as unknown as (...a: unknown[]) => unknown)(...args);
  },
});
