import type {
  AddressPayload,
  ContactUpdateRequest,
  ContactUpdateResponseBody,
} from "next-address-server-js";
import { NextAddressError } from "next-address-server-js";
import { isMockRotatingOutcomes } from "@/lib/config";
import {
  simulationEventsFromConsume,
  type NetworkActivityExchange,
  type SimulationEvent,
} from "next-address-server-js/embed";
import { getContactUpdatePath, getNextAddressClientOrNull } from "@/lib/integrations/primaryClient";
import {
  getContactUpdatePathForServer,
  getNextAddressClientWithNetworkLog,
} from "@/lib/integrations/serverNetworkLog";
import {
  consumeTenantSimulation,
  tenantSimulationContactPushError,
} from "@/lib/integrations/tenantSimulationArms";
import type { PublicUser } from "@/lib/db/users";
import { createHash } from "node:crypto";

const norm = (s: string) => s.trim();

type BuiltPatch = { body: ContactUpdateRequest; idempotencyKey: string };

function addressPayload(address: PublicUser["address"]): AddressPayload {
  return {
    ...address,
    label: "default",
  };
}

function buildChangedPatches(
  before: PublicUser,
  after: PublicUser,
  base: { externalUserId: string },
): BuiltPatch[] {
  const patches: BuiltPatch[] = [];

  if (norm(before.fullName) !== norm(after.fullName)) {
    const [firstName, ...rest] = norm(after.fullName).split(/\s+/);
    const body: ContactUpdateRequest = {
      externalUserId: base.externalUserId,
      kind: "name",
      firstName: firstName || undefined,
      lastName: rest.length > 0 ? rest.join(" ") : undefined,
    };
    patches.push({
      body,
      idempotencyKey: `${base.externalUserId}-name-${hashId(body)}`,
    });
  }
  if (norm(before.phone) !== norm(after.phone)) {
    const body: ContactUpdateRequest = {
      externalUserId: base.externalUserId,
      kind: "phone",
      phone: after.phone,
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
    const body: ContactUpdateRequest = {
      externalUserId: base.externalUserId,
      kind: "address",
      address: addressPayload(after.address),
      previousAddress: addressPayload(before.address),
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
  if (!isMockRotatingOutcomes()) {
    return { status: "processed_globally" };
  }
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
    message:
      "No linked profile for this user on NextAddress (rotating mock outcome; tweak a field or turn off NEXT_ADDRESS_MOCK_ROTATE_OUTCOMES).",
  };
}

function isContactUpdateResponseBody(b: unknown): b is ContactUpdateResponseBody {
  if (!b || typeof b !== "object") return false;
  const s = (b as { status?: unknown }).status;
  if (s !== "processed_globally" && s !== "pending_user_review" && s !== "rejected")
    return false;
  return true;
}

export type PrimaryPatchResult = ContactUpdateResponseBody & {
  error?: string;
  /** Set when next-address-primary responded with an HTTP 4xx. */
  httpStatus?: number;
};

function isPrimarySyncSuccess(r: PrimaryPatchResult): boolean {
  return r.status === "processed_globally" || r.status === "pending_user_review";
}

function isPrimaryHttp4xx(status: number | undefined): boolean {
  return status !== undefined && status >= 400 && status < 500;
}

/** Primary returns this when the tenant user is not connected on NextAddress yet. */
function isUnknownUserMappingResult(r: PrimaryPatchResult): boolean {
  return r.httpStatus === 404 && r.message === "Unknown user mapping";
}

function skippedPrimarySyncResult(
  toSend: BuiltPatch[],
  networkActivity: NetworkActivityExchange[],
  simulationEvents: SimulationEvent[] = [],
) {
  return {
    patches: toSend.map((x) => x.body),
    results: [] as PrimaryPatchResult[],
    attemptedPrimary: false,
    syncedToNextAddress: false,
    nextAddressHttp4xx: false,
    failureMessages: [] as string[],
    networkActivity,
    simulationEvents,
  };
}

export function summarizePrimarySync(
  results: PrimaryPatchResult[],
  attemptedPrimary: boolean,
): {
  syncedToNextAddress: boolean;
  nextAddressHttp4xx: boolean;
  failureMessages: string[];
} {
  if (!attemptedPrimary || results.length === 0) {
    return { syncedToNextAddress: false, nextAddressHttp4xx: false, failureMessages: [] };
  }
  const failures = results.filter(
    (r) => isPrimaryHttp4xx(r.httpStatus) || r.status === "rejected",
  );
  return {
    syncedToNextAddress: results.every(isPrimarySyncSuccess),
    nextAddressHttp4xx: failures.some((r) => isPrimaryHttp4xx(r.httpStatus)),
    failureMessages: failures
      .map((r) => r.message ?? r.error)
      .filter((m): m is string => Boolean(m)),
  };
}

/**
 * Pushes one PATCH per changed contact dimension to next-address-primary.
 * Bodies are minimal (only the slice that actually changed, plus routing ids).
 */
export async function pushContactUpdatesToPrimary(
  before: PublicUser,
  after: PublicUser,
  options?: { networkActivity?: NetworkActivityExchange[] },
): Promise<{
  patches: ContactUpdateRequest[];
  results: PrimaryPatchResult[];
  attemptedPrimary: boolean;
  syncedToNextAddress: boolean;
  nextAddressHttp4xx: boolean;
  failureMessages: string[];
  networkActivity: NetworkActivityExchange[];
  simulationEvents: SimulationEvent[];
}> {
  const base = { externalUserId: after.id };
  const toSend = buildChangedPatches(before, after, base);
  if (toSend.length === 0) {
    return {
      patches: [],
      results: [],
      attemptedPrimary: false,
      syncedToNextAddress: false,
      nextAddressHttp4xx: false,
      failureMessages: [],
      networkActivity: options?.networkActivity ?? [],
      simulationEvents: [],
    };
  }

  const networkActivity = options?.networkActivity ?? [];
  const client =
    options?.networkActivity != null
      ? getNextAddressClientWithNetworkLog(networkActivity)
      : getNextAddressClientOrNull();
  const path =
    options?.networkActivity != null ? getContactUpdatePathForServer() : getContactUpdatePath();

  const results: PrimaryPatchResult[] = [];
  const tenantSim = consumeTenantSimulation(after.id, "contact_push");
  if (tenantSim) {
    try {
      tenantSimulationContactPushError(tenantSim);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Simulated network error";
      for (let i = 0; i < toSend.length; i += 1) {
        results.push({
          status: "rejected",
          message,
          error: message,
        });
      }
      const summary = summarizePrimarySync(results, true);
      return {
        patches: toSend.map((x) => x.body),
        results,
        attemptedPrimary: true,
        ...summary,
        networkActivity,
        simulationEvents: simulationEventsFromConsume(
          tenantSim,
          "contact_push",
          message,
        ),
      };
    }
  }

  for (const p of toSend) {
    if (!client) {
      results.push({ ...mockResponse(p.idempotencyKey) });
      continue;
    }
    try {
      const res = await client.saveContactInfo(p.body, {
        path,
        idempotencyKey: p.idempotencyKey,
      });
      if (res.status === "queued") {
        results.push({
          status: "pending_user_review",
          message: res.message ?? "Queued for NextAddress sync",
        });
      } else {
        results.push(res);
      }
    } catch (e) {
      if (e instanceof NextAddressError && e.body && isContactUpdateResponseBody(e.body)) {
        const patchResult: PrimaryPatchResult = {
          ...e.body,
          httpStatus: e.status,
          error: isPrimaryHttp4xx(e.status) ? e.message : undefined,
        };
        if (isUnknownUserMappingResult(patchResult)) {
          return skippedPrimarySyncResult(toSend, networkActivity);
        }
        results.push(patchResult);
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
          httpStatus: e.status,
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
  const summary = summarizePrimarySync(results, true);
  if (
    results.length > 0 &&
    results.every(isUnknownUserMappingResult)
  ) {
    return skippedPrimarySyncResult(toSend, networkActivity);
  }
  return {
    patches: toSend.map((x) => x.body),
    results,
    attemptedPrimary: true,
    ...summary,
    networkActivity,
    simulationEvents: [],
  };
}
