import { NextResponse } from "next/server";
import { getUserById, updateUserById, type UpdateUserInput } from "@/lib/db/users";
import { getSessionUserId } from "@/lib/auth/session";
import { pushContactUpdatesToPrimary } from "@/lib/integrations/pushContactPatches";
import { createServerNetworkCollector } from "@/lib/integrations/serverNetworkLog";

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
  const updated = updateUserById(before.id, next);
  if (!updated) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  const networkActivity = createServerNetworkCollector();
  const primary = await pushContactUpdatesToPrimary(before, updated, { networkActivity });
  return NextResponse.json({
    user: updated,
    networkActivity,
    simulationEvents: primary.simulationEvents,
    primary: {
      patches: primary.patches,
      results: primary.results,
      attemptedPrimary: primary.attemptedPrimary,
      savedLocally: true,
      syncedToNextAddress: primary.syncedToNextAddress,
      nextAddressHttp4xx: primary.nextAddressHttp4xx,
      failureMessages: primary.failureMessages,
    },
  });
}
