import { NextResponse } from "next/server";
import {
  getDemoStaffGateSecret,
  verifyDemoStaffGateToken,
} from "@/lib/auth/staff-gate-token";
import {
  clearStaffSession,
  getStaffSession,
  mockStaffSessionIfAllowed,
  setStaffSession,
} from "@/lib/auth/staff-session";
import { getDemoBaseUrl, getPrimaryBaseUrl, getPrimarySignInUrl } from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  const existing = await getStaffSession();
  const mock = existing ? null : mockStaffSessionIfAllowed();
  const staff = existing ?? mock;
  if (mock && !existing) {
    await setStaffSession(mock);
  }
  const primaryBaseUrl = getPrimaryBaseUrl();
  return NextResponse.json({
    staff,
    primaryBaseUrl: primaryBaseUrl || null,
    primarySignInUrl: primaryBaseUrl
      ? getPrimarySignInUrl(`${getDemoBaseUrl()}/login`)
      : null,
  });
}

type Body = { staffGateToken?: string };

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  const token = body?.staffGateToken?.trim() ?? "";
  const secret = getDemoStaffGateSecret();

  if (!token) {
    const mock = mockStaffSessionIfAllowed();
    if (mock) {
      await setStaffSession(mock);
      return NextResponse.json({ staff: mock });
    }
    return NextResponse.json(
      { error: "staffGateToken is required.", code: "staff_required" },
      { status: 400 },
    );
  }

  const verified = verifyDemoStaffGateToken(token, secret);
  if (!verified.ok) {
    return NextResponse.json(
      {
        error: "Invalid or expired Anemone staff gate token. Sign in to Anemone again.",
        code: verified.reason,
      },
      { status: 401 },
    );
  }

  const staff = {
    anemoneUserId: verified.claims.anemoneUserId,
    role: verified.claims.role,
  };
  await setStaffSession(staff);
  return NextResponse.json({ staff });
}

export async function DELETE() {
  await clearStaffSession();
  return NextResponse.json({ ok: true });
}
