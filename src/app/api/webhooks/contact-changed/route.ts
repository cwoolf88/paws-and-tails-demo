import {
  parseWebhookEvent,
  verifyWebhookSignature,
  WebhookVerificationError,
} from "anemone-server-js";
import { NextResponse } from "next/server";
import { getWebhookSecret } from "@/lib/config";
import {
  applyContactChangeFromPrimary,
  applyContactReviewFromPrimary,
} from "@/lib/integrations/applyContactWebhookEvent";

export const runtime = "nodejs";

function toHeaderRecord(h: Headers): Record<string, string | string[] | undefined> {
  const out: Record<string, string | string[] | undefined> = {};
  h.forEach((v, k) => {
    out[k.toLowerCase()] = v;
  });
  return out;
}

export async function POST(request: Request) {
  const secret = getWebhookSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "ANEMONE_WEBHOOK_SECRET is not set" },
      { status: 500 },
    );
  }
  const raw = await request.text();
  const headerRecord = toHeaderRecord(request.headers);
  try {
    verifyWebhookSignature(raw, headerRecord, secret, { toleranceSeconds: 300 });
  } catch {
    return new NextResponse("Invalid webhook", { status: 401 });
  }

  let event;
  try {
    event = parseWebhookEvent(raw);
  } catch (e) {
    const message = e instanceof WebhookVerificationError ? e.message : "Invalid webhook payload";
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }

  if (event.event === "contact.update.reviewed") {
    const r = applyContactReviewFromPrimary(event);
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, reason: r.reason, event },
        { status: 422 },
      );
    }
    return NextResponse.json({
      ok: true,
      user: r.user,
      applied: r.applied,
      event,
    });
  }

  if (event.event === "contact.changed") {
    const full = JSON.parse(raw) as {
      name?: { fullName?: string; firstName?: string; lastName?: string };
      phone?: { e164?: string; raw?: string };
      email?: { address?: string };
    };
    const r = applyContactChangeFromPrimary(event, {
      name: full.name,
      phone: full.phone,
      email: full.email,
    });
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, reason: r.reason, event },
        { status: 422 },
      );
    }
    return NextResponse.json({ ok: true, user: r.user, event });
  }

  return NextResponse.json(
    { ok: false, error: `Unsupported event: ${event.event}` },
    { status: 422 },
  );
}
