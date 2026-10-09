import { randomUUID } from "node:crypto";
import { hashPassword, isPasswordSet, verifyPassword } from "@/lib/auth/password";
import type { UserRow } from "./client";
import { getUserStore } from "./userStore";
import { getAnemoneClientOrNull } from "@/lib/integrations/primaryClient";

export { EmailTakenError } from "./userStore";

export type PublicUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    region: string;
    postalCode: string;
    countryCode: string;
  };
  createdAt: string;
  updatedAt: string;
};

function rowToUser(r: UserRow): PublicUser {
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    phone: r.phone,
    address: {
      line1: r.line1,
      line2: r.line2,
      city: r.city,
      region: r.region,
      postalCode: r.postal_code,
      countryCode: r.country_code,
    },
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listUsers() {
  const rows = await (await getUserStore()).list();
  return rows.map((r) => rowToUser(r));
}

export async function getUserById(id: string) {
  const row = await (await getUserStore()).getById(id);
  return row ? rowToUser(row) : null;
}

export async function getUserByEmail(email: string) {
  const row = await getUserRowByEmail(email);
  return row ? rowToUser(row) : null;
}

async function getUserRowByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  return (await getUserStore()).getByEmail(normalized);
}

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export async function createUser(input: CreateUserInput) {
  const now = new Date().toISOString();
  const row: UserRow = {
    id: randomUUID(),
    email: input.email.trim(),
    full_name: `${input.firstName} ${input.lastName}`.trim(),
    password_hash: hashPassword(input.password),
    phone: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postal_code: "",
    country_code: "US",
    created_at: now,
    updated_at: now,
  };
  await (await getUserStore()).insert(row);
  return rowToUser(row);
}

export type PasswordLoginResult =
  | { ok: true; user: PublicUser }
  | { ok: false; code: "invalid_credentials" | "password_not_set"; message: string };

/** Email + password login used by the browser-agent demo path. */
export async function authenticateWithPassword(
  email: string,
  password: string,
): Promise<PasswordLoginResult> {
  const row = await getUserRowByEmail(email);
  if (!row) {
    return {
      ok: false,
      code: "invalid_credentials",
      message: "Incorrect email or password.",
    };
  }
  if (!isPasswordSet(row.password_hash)) {
    return {
      ok: false,
      code: "password_not_set",
      message:
        "This demo account has no password yet. Sign up a new account with a password, or use the demo user picker below.",
    };
  }
  if (!verifyPassword(password, row.password_hash)) {
    return {
      ok: false,
      code: "invalid_credentials",
      message: "Incorrect email or password.",
    };
  }
  return { ok: true, user: rowToUser(row) };
}

export async function deleteUserById(id: string) {
  const user = await getUserById(id);
  if (!user) return null;

  const client = getAnemoneClientOrNull();
  if (client) {
    try {
      await client.markTenantExternalUserDeleted({ externalUserId: id });
    } catch {
      // Demo delete still proceeds if primary is unavailable.
    }
  }

  await (await getUserStore()).delete(id);
  return user;
}

export type UpdateUserInput = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
};

export async function updateUserById(id: string, data: UpdateUserInput) {
  const row = await (await getUserStore()).update(id, {
    full_name: data.fullName,
    phone: data.phone,
    line1: data.line1,
    line2: data.line2,
    city: data.city,
    region: data.region,
    postal_code: data.postalCode,
    country_code: data.countryCode,
    updated_at: new Date().toISOString(),
  });
  return row ? rowToUser(row) : null;
}
