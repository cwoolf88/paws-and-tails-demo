import { cookies } from "next/headers";
import type { DemoStaffRole } from "@/lib/auth/staff-gate-token";
import { isPrimaryMockMode } from "@/lib/config";

const COOKIE = "paws_staff_session";
const MOCK_OWNER_ID = "local-mock-staff";

export type StaffSession = {
  anemoneUserId: string;
  role: DemoStaffRole;
};

type CookiePayload = StaffSession & { exp: number };

const STAFF_COOKIE_TTL_SECONDS = 60 * 60 * 12;

function encode(session: CookiePayload): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

function decode(raw: string | undefined): CookiePayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as CookiePayload;
    if (
      typeof parsed.anemoneUserId !== "string" ||
      !parsed.anemoneUserId.trim() ||
      typeof parsed.role !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return {
      anemoneUserId: parsed.anemoneUserId.trim(),
      role: parsed.role as DemoStaffRole,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const c = await cookies();
  const payload = decode(c.get(COOKIE)?.value);
  if (!payload) return null;
  return { anemoneUserId: payload.anemoneUserId, role: payload.role };
}

export async function setStaffSession(session: StaffSession) {
  const c = await cookies();
  const payload: CookiePayload = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + STAFF_COOKIE_TTL_SECONDS,
  };
  c.set(COOKIE, encode(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: STAFF_COOKIE_TTL_SECONDS,
  });
}

export async function clearStaffSession() {
  const c = await cookies();
  c.set(COOKIE, "", { path: "/", maxAge: 0 });
}

/** Local mock mode without a shared secret: allow a fixed staff owner for DX. */
export function mockStaffSessionIfAllowed(): StaffSession | null {
  if (!isPrimaryMockMode()) return null;
  if (process.env.ANEMONE_DEMO_STAFF_GATE_SECRET?.trim()) return null;
  return { anemoneUserId: MOCK_OWNER_ID, role: "developer" };
}

export async function requireStaffSession(): Promise<
  { ok: true; staff: StaffSession } | { ok: false; response: Response }
> {
  const existing = await getStaffSession();
  if (existing) return { ok: true, staff: existing };
  const mock = mockStaffSessionIfAllowed();
  if (mock) {
    await setStaffSession(mock);
    return { ok: true, staff: mock };
  }
  return {
    ok: false,
    response: Response.json(
      {
        error: "Sign in to Anemone with a staff account (tenant staff or above) to manage demo users.",
        code: "staff_required",
      },
      { status: 401 },
    ),
  };
}
