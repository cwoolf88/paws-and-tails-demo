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
  const u = await getUserById(id);
  if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user: u });
}

export async function PUT(request: Request) {
  const id = await getSessionUserId();
  if (!id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const before = await getUserById(id);
  if (!before) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  // Required fields fall back when blank. line2 is optional — empty string must clear Apt/unit.
  const required = (next: string | undefined, fallback: string) =>
    (next ?? fallback).trim() || fallback;
  const next: UpdateUserInput = {
    fullName: required(body.fullName, before.fullName),
    phone: required(body.phone, before.phone),
    line1: required(body.line1, before.address.line1),
    line2:
      body.line2 === undefined || body.line2 === null
        ? before.address.line2
        : body.line2.trim(),
    city: required(body.city, before.address.city),
    region: required(body.region, before.address.region),
    postalCode: required(body.postalCode, before.address.postalCode),
    countryCode: required(body.countryCode, before.address.countryCode),
  };
  const updated = await updateUserById(before.id, next);
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
      syncedToAnemone: primary.syncedToAnemone,
      anemoneHttp4xx: primary.anemoneHttp4xx,
      failureMessages: primary.failureMessages,
    },
  });
}
