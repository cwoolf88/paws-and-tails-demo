import type { ContactUpdateRequest, ContactUpdateResponseBody } from "next-address-server-js";
import { NextAddressError } from "next-address-server-js";
import { isPrimaryMockMode } from "@/lib/config";
import { getContactUpdatePath, getNextAddressClientOrNull } from "@/lib/integrations/primaryClient";
import type { PublicUser } from "@/lib/db/users";
import { createHash } from "node:crypto";

const norm = (s: string) => s.trim();

type BuiltPatch = { body: ContactUpdateRequest; idempotencyKey: string };

function takeAddressPartials(
  _before: PublicUser["address"],
  after: PublicUser["address"],
  changedKeys: (keyof PublicUser["address"])[],
) {
  const p: Record<string, string> = {};
  for (const k of changedKeys) p[k] = (after as Record<string, string>)[k] ?? "";
  if (Object.keys(p).length > 0) p.label = "default";
  return p as {
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    countryCode?: string;
    label?: string;
  };
}

function buildChangedPatches(
  before: PublicUser,
  after: PublicUser,
  base: { tenantId: string; externalUserId: string },
): BuiltPatch[] {
  const patches: BuiltPatch[] = [];

  if (norm(before.fullName) !== norm(after.fullName)) {
    const body: ContactUpdateRequest = {
      tenantId: base.tenantId,
      externalUserId: base.externalUserId,
      kind: "name",
      name: { fullName: after.fullName },
    };
    patches.push({
      body,
      idempotencyKey: `${base.externalUserId}-name-${hashId(body)}`,
    });
  }
  if (norm(before.email) !== norm(after.email)) {
    const body: ContactUpdateRequest = {
      tenantId: base.tenantId,
      externalUserId: base.externalUserId,
      kind: "email",
      email: { address: after.email },
    };
    patches.push({ body, idempotencyKey: `${base.externalUserId}-email-${hashId(body)}` });
  }
  if (norm(before.phone) !== norm(after.phone)) {
    const body: ContactUpdateRequest = {
      tenantId: base.tenantId,
      externalUserId: base.externalUserId,
      kind: "phone",
      phone: { raw: after.phone },
    };
    patches.push({ body, idempotencyKey: `${base.externalUserId}-phone-${hashId(body)}` });
  }

  const aKeys: (keyof PublicUser["address"])[] = [
    "line1",
    "line2",
    "city",
    "region",
    "postalCode",
    "countryCode",
  ];
  const changed: (keyof PublicUser["address"])[] = [];
  for (const k of aKeys) {
    if (norm(before.address[k] ?? "") !== norm(after.address[k] ?? "")) {
      changed.push(k);
    }
  }
  if (changed.length > 0) {
    const p = takeAddressPartials(before.address, after.address, changed);
    const body: ContactUpdateRequest = {
      tenantId: base.tenantId,
      externalUserId: base.externalUserId,
      kind: "address",
      address: p,
    };
    patches.push({ body, idempotencyKey: `${base.externalUserId}-addr-${hashId(body)}` });
  }
  return patches;
}

function hashId(body: object) {
  return createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex")
    .slice(0, 16);
}

function mockResponse(idempotencyKey: string): ContactUpdateResponseBody {
  const h = createHash("sha256").update(idempotencyKey).digest("hex");
  const b = parseInt(h.slice(0, 2), 16) % 3;
  if (b === 0) return { status: "processed_globally" };
  if (b === 1)
    return {
      status: "pending_user_review",
      message: "Your change is being reviewed by a human with opposable thumbs.",
    };
  return {
    status: "rejected",
    message: "No linked profile for this user on the primary (demo: rotate idempotency key to try other outcomes).",
  };
}

function isContactUpdateResponseBody(b: unknown): b is ContactUpdateResponseBody {
  if (!b || typeof b !== "object") return false;
  const s = (b as { status?: unknown }).status;
  if (s !== "processed_globally" && s !== "pending_user_review" && s !== "rejected")
    return false;
  return true;
}

/**
 * Pushes one PATCH per changed contact dimension to next-address-primary.
 * Bodies are minimal (only the slice that actually changed, plus routing ids).
 */
export async function pushContactUpdatesToPrimary(
  before: PublicUser,
  after: PublicUser,
): Promise<{
  patches: ContactUpdateRequest[];
  results: (ContactUpdateResponseBody & { error?: string })[];
  attemptedPrimary: boolean;
}> {
  const base = { tenantId: after.tenantId, externalUserId: after.id };
  const toSend = buildChangedPatches(before, after, base);
  if (toSend.length === 0) {
    return { patches: [], results: [], attemptedPrimary: false };
  }
  const client = getNextAddressClientOrNull();
  const useMock = isPrimaryMockMode() || !client;
  const path = getContactUpdatePath();
  const method = "PATCH" as const;

  const results: (ContactUpdateResponseBody & { error?: string })[] = [];
  for (const p of toSend) {
    if (useMock) {
      results.push({ ...mockResponse(p.idempotencyKey) });
      continue;
    }
    try {
      const res = await client!.submitContactUpdate(p.body, {
        path,
        method,
        idempotencyKey: p.idempotencyKey,
      });
      results.push(res);
    } catch (e) {
      if (e instanceof NextAddressError && e.body && isContactUpdateResponseBody(e.body)) {
        results.push({ ...e.body });
        continue;
      }
      if (e instanceof NextAddressError) {
        const msg =
          e.body && typeof (e.body as { message?: unknown }).message === "string"
            ? (e.body as { message: string }).message
            : e.message;
        results.push({
          status: "rejected",
          message: msg,
          error: e.message,
        });
        continue;
      }
      const message = e instanceof Error ? e.message : "Unknown error";
      results.push({
        status: "rejected",
        message,
        error: message,
      });
    }
  }
  return { patches: toSend.map((x) => x.body), results, attemptedPrimary: true };
}
