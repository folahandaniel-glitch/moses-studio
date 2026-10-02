import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ set: () => {}, delete: () => {}, get: () => undefined }) }));

describe("session tokens", () => {
  beforeAll(() => { process.env.AUTH_SECRET = "x".repeat(40); });

  it("round trips a signed session", async () => {
    const { signSession, verifySession } = await import("@/lib/session");
    expect(await verifySession(await signSession({ uid: "u1", tv: 2 }))).toEqual({ uid: "u1", tv: 2 });
  });
  it("rejects tampered or missing tokens", async () => {
    const { signSession, verifySession } = await import("@/lib/session");
    const token = await signSession({ uid: "u1", tv: 0 });
    expect(await verifySession(token.slice(0, -2) + "xx")).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession("garbage")).toBeNull();
  });
  it("rejects tokens signed with another secret", async () => {
    const { signSession } = await import("@/lib/session");
    const token = await signSession({ uid: "u1", tv: 0 });
    process.env.AUTH_SECRET = "y".repeat(40);
    const { verifySession } = await import("@/lib/session");
    expect(await verifySession(token)).toBeNull();
  });
});
