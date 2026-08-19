import { describe, it, expect, beforeAll } from "vitest";
import { signSession, verifySession } from "@/lib/auth/jwt";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-at-least-32-characters-long";
});

describe("jwt session tokens", () => {
  it("signs and verifies a round-trip payload", async () => {
    const token = await signSession({ sub: "user_1", email: "a@b.com", role: "CUSTOMER" });
    const payload = await verifySession(token);
    expect(payload).toEqual({ sub: "user_1", email: "a@b.com", role: "CUSTOMER" });
  });

  it("rejects a tampered token", async () => {
    const token = await signSession({ sub: "user_1", email: "a@b.com", role: "CUSTOMER" });
    const tampered = token.slice(0, -2) + "xx";
    const payload = await verifySession(tampered);
    expect(payload).toBeNull();
  });

  it("rejects garbage input", async () => {
    const payload = await verifySession("not-a-real-token");
    expect(payload).toBeNull();
  });
});
