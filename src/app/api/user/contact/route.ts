import { NextResponse } from "next/server";
import { getUserById, updateUserById, type UpdateUserInput } from "@/lib/db/users";
import { getSessionUserId } from "@/lib/auth/session";
import { pushContactUpdatesToPrimary } from "@/lib/integrations/pushContactPatches";

export const runtime = "nodejs";

type Body = Partial<UpdateUserInput> & { fullName?: string };

export async function GET() {
  const id = await getSessionUserId();
  if (!id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const u = getUserById(id);
  if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user: u });
}

export async function PUT(request: Request) {
  const id = await getSessionUserId();
  if (!id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const before = getUserById(id);
  if (!before) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const next: UpdateUserInput = {
    fullName: (body.fullName ?? before.fullName).trim() || before.fullName,
    email: (body.email ?? before.email).trim() || before.email,
    phone: (body.phone ?? before.phone).trim() || before.phone,
    line1: (body.line1 ?? before.address.line1).trim() || before.address.line1,
    line2: (body.line2 ?? before.address.line2).trim() || before.address.line2,
    city: (body.city ?? before.address.city).trim() || before.address.city,
    region: (body.region ?? before.address.region).trim() || before.address.region,
    postalCode: (body.postalCode ?? before.address.postalCode).trim() || before.address.postalCode,
    countryCode: (body.countryCode ?? before.address.countryCode).trim() || before.address.countryCode,
  };
  const proposed: typeof before = {
    id: before.id,
    tenantId: before.tenantId,
    fullName: next.fullName,
    email: next.email,
    phone: next.phone,
    address: {
      line1: next.line1,
      line2: next.line2,
      city: next.city,
      region: next.region,
      postalCode: next.postalCode,
      countryCode: next.countryCode,
    },
    createdAt: before.createdAt,
    updatedAt: before.updatedAt,
  };
  const { patches, results, attemptedPrimary } = await pushContactUpdatesToPrimary(
    before,
    proposed,
  );
  const updated = updateUserById(before.id, next);
  if (!updated) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({
    user: updated,
    primary: { patches, results, attemptedPrimary },
  });
}
