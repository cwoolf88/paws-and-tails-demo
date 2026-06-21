import { verifyWebhookSignature } from "next-address-server-js";
import { NextResponse } from "next/server";
import { getWebhookSecret } from "@/lib/config";
import { getUserById } from "@/lib/db/users";

export const runtime = "nodejs";

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0]!, lastName: "" };
  }
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}

function toHeaderRecord(headers: Headers): Record<string, string | string[] | undefined> {
  const out: Record<string, string | string[] | undefined> = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

type ProfileRequestedEvent = {
  event: "account.profile.requested";
  externalUserId?: string;
};

export async function POST(request: Request) {
  const secret = getWebhookSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "NEXT_ADDRESS_WEBHOOK_SECRET is not set" },
      { status: 500 },
    );
  }

  const raw = await request.text();
  try {
    verifyWebhookSignature(raw, toHeaderRecord(request.headers), secret, {
      toleranceSeconds: 300,
    });
  } catch {
    return new NextResponse("Invalid webhook", { status: 401 });
  }

  let event: ProfileRequestedEvent;
  try {
    event = JSON.parse(raw) as ProfileRequestedEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event !== "account.profile.requested") {
    return NextResponse.json({ error: "Unsupported event" }, { status: 422 });
  }

  const externalUserId = event.externalUserId?.trim();
  if (!externalUserId) {
    return NextResponse.json({ error: "externalUserId is required" }, { status: 400 });
  }

  const user = getUserById(externalUserId);
  if (!user) {
    return NextResponse.json({ found: false });
  }

  const { firstName, lastName } = splitFullName(user.fullName);
  return NextResponse.json({
    found: true,
    firstName,
    lastName,
    phone: user.phone,
  });
}
