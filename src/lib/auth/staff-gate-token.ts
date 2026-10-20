import { createHmac, timingSafeEqual } from "node:crypto";

/** Must stay aligned with anemone `src/lib/demo/staff-gate-token.ts`. */
export type DemoStaffRole =
  | "tenant_staff"
  | "developer"
  | "account_admin"
  | "anemone_staff"
  | "super_admin";

const ELIGIBLE_ROLES: readonly DemoStaffRole[] = [
  "tenant_staff",
  "developer",
  "account_admin",
  "anemone_staff",
  "super_admin",
];

export type DemoStaffGateClaims = {
  anemoneUserId: string;
  role: DemoStaffRole;
  exp: number;
};

export function getDemoStaffGateSecret(): string {
  return process.env.ANEMONE_DEMO_STAFF_GATE_SECRET?.trim() ?? "";
}

function isEligibleRole(role: string | null | undefined): role is DemoStaffRole {
  return !!role && (ELIGIBLE_ROLES as readonly string[]).includes(role);
}

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64, "utf8").digest("base64url");
}

export type VerifyDemoStaffGateResult =
  | { ok: true; claims: DemoStaffGateClaims }
  | { ok: false; reason: "missing" | "malformed" | "bad_signature" | "expired" | "ineligible" };

export function verifyDemoStaffGateToken(
  token: string | null | undefined,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): VerifyDemoStaffGateResult {
  if (!token?.trim()) return { ok: false, reason: "missing" };
  if (!secret) return { ok: false, reason: "missing" };
  const parts = token.trim().split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, reason: "malformed" };
  }
  const [payloadB64, sig] = parts;
  const expected = sign(payloadB64, secret);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return { ok: false, reason: "bad_signature" };
  }
  let claims: DemoStaffGateClaims;
  try {
    claims = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as DemoStaffGateClaims;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (
    typeof claims.anemoneUserId !== "string" ||
    !claims.anemoneUserId.trim() ||
    typeof claims.exp !== "number"
  ) {
    return { ok: false, reason: "malformed" };
  }
  if (!isEligibleRole(claims.role)) {
    return { ok: false, reason: "ineligible" };
  }
  if (claims.exp < nowSeconds) {
    return { ok: false, reason: "expired" };
  }
  return {
    ok: true,
    claims: {
      anemoneUserId: claims.anemoneUserId.trim(),
      role: claims.role,
      exp: claims.exp,
    },
  };
}

/** Local mock / unit-test mint (Anemone mints the real tokens in production). */
export function mintDemoStaffGateTokenForTests(
  claims: Omit<DemoStaffGateClaims, "exp"> & { exp?: number },
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  const payload: DemoStaffGateClaims = {
    anemoneUserId: claims.anemoneUserId.trim(),
    role: claims.role,
    exp: claims.exp ?? nowSeconds + 5 * 60,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}
