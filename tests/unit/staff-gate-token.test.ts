import { describe, expect, it } from "vitest";
import {
  mintDemoStaffGateTokenForTests,
  verifyDemoStaffGateToken,
} from "@/lib/auth/staff-gate-token";

describe("demo staff gate token", () => {
  const secret = "paws-demo-staff-gate-secret";

  it("verifies tokens minted with the shared HMAC format", () => {
    const token = mintDemoStaffGateTokenForTests(
      { anemoneUserId: "staff-1", role: "tenant_staff" },
      secret,
      1_700_000_000,
    );
    expect(verifyDemoStaffGateToken(token, secret, 1_700_000_000)).toEqual({
      ok: true,
      claims: {
        anemoneUserId: "staff-1",
        role: "tenant_staff",
        exp: 1_700_000_000 + 5 * 60,
      },
    });
  });

  it("rejects tampered or expired tokens", () => {
    const token = mintDemoStaffGateTokenForTests(
      { anemoneUserId: "staff-1", role: "developer" },
      secret,
      1_700_000_000,
    );
    expect(verifyDemoStaffGateToken(token, "wrong", 1_700_000_000).ok).toBe(false);
    expect(verifyDemoStaffGateToken(token, secret, 1_700_000_000 + 600).ok).toBe(false);
  });
});
