import type { ContactChangeWebhookEvent } from "next-address-server-js";
import { getUserById, updateUserById, type PublicUser, type UpdateUserInput } from "@/lib/db/users";

type RawEnvelope = {
  name?: { fullName?: string; firstName?: string; lastName?: string };
  phone?: { e164?: string; raw?: string };
  email?: { address?: string };
};

/**
 * Application mapping from a verified `contact.changed` event into the demo's user row.
 * Pass the raw JSON object for optional fields the SDK parser has not yet normalized.
 */
export function applyContactChangeFromPrimary(
  event: ContactChangeWebhookEvent,
  raw: RawEnvelope,
): { ok: true; user: PublicUser } | { ok: false; reason: string } {
  const user = getUserById(event.externalUserId);
  if (!user) {
    return { ok: false, reason: "No local user matches externalUserId" };
  }
  const next: UpdateUserInput = {
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    line1: user.address.line1,
    line2: user.address.line2,
    city: user.address.city,
    region: user.address.region,
    postalCode: user.address.postalCode,
    countryCode: user.address.countryCode,
  };
  if (event.kind === "name" && raw.name?.fullName) {
    next.fullName = raw.name.fullName;
  }
  if (event.kind === "email" && raw.email?.address) {
    next.email = raw.email.address;
  }
  if (event.kind === "phone" && (raw.phone?.e164 || raw.phone?.raw)) {
    next.phone = raw.phone.e164 ?? raw.phone.raw ?? user.phone;
  }
  if (event.kind === "address" && event.address) {
    const a = event.address;
    if (a.line1 !== undefined) next.line1 = a.line1;
    if (a.line2 !== undefined) next.line2 = a.line2;
    if (a.city !== undefined) next.city = a.city;
    if (a.region !== undefined) next.region = a.region;
    if (a.postalCode !== undefined) next.postalCode = a.postalCode;
    if (a.countryCode !== undefined) next.countryCode = a.countryCode;
  }
  const updated = updateUserById(user.id, next);
  if (!updated) return { ok: false, reason: "Update failed" };
  return { ok: true, user: updated };
}
