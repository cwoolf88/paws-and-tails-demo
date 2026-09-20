import { randomUUID } from "node:crypto";
import { hashPassword, isPasswordSet, verifyPassword } from "@/lib/auth/password";
import { getDb, type UserRow } from "./client";
import { getAnemoneClientOrNull } from "@/lib/integrations/primaryClient";

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

export function listUsers() {
  const database = getDb();
  const rows = database
    .prepare("SELECT * FROM users ORDER BY full_name ASC")
    .all() as UserRow[];
  return rows.map((r) => rowToUser(r));
}

export function getUserById(id: string) {
  const database = getDb();
  const row = database.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | UserRow
    | undefined;
  return row ? rowToUser(row) : null;
}

export function getUserByEmail(email: string) {
  const row = getUserRowByEmail(email);
  return row ? rowToUser(row) : null;
}

function getUserRowByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const database = getDb();
  const row = database.prepare("SELECT * FROM users WHERE lower(email) = ? LIMIT 1").get(normalized) as
    | UserRow
    | undefined;
  return row ?? null;
}

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export function createUser(input: CreateUserInput) {
  const database = getDb();
  const now = new Date().toISOString();
  const id = randomUUID();
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const email = input.email.trim();
  const passwordHash = hashPassword(input.password);

  database
    .prepare(
      `INSERT INTO users (
        id, email, full_name, password_hash, phone, line1, line2, city, region, postal_code, country_code, created_at, updated_at
      ) VALUES (
        @id, @email, @fullName, @passwordHash, '', '', '', '', '', '', 'US', @now, @now
      )`,
    )
    .run({
      id,
      email,
      fullName,
      passwordHash,
      now,
    });

  const created = getUserById(id);
  if (!created) throw new Error("Failed to create user");
  return created;
}

export type PasswordLoginResult =
  | { ok: true; user: PublicUser }
  | { ok: false; code: "invalid_credentials" | "password_not_set"; message: string };

/** Email + password login used by the browser-agent demo path. */
export function authenticateWithPassword(
  email: string,
  password: string,
): PasswordLoginResult {
  const row = getUserRowByEmail(email);
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
  const user = getUserById(id);
  if (!user) return null;

  const client = getAnemoneClientOrNull();
  if (client) {
    try {
      await client.markTenantExternalUserDeleted({ externalUserId: id });
    } catch {
      // Demo delete still proceeds if primary is unavailable.
    }
  }

  const database = getDb();
  database.prepare("DELETE FROM users WHERE id = ?").run(id);
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

export function updateUserById(id: string, data: UpdateUserInput) {
  const database = getDb();
  const now = new Date().toISOString();
  const result = database
    .prepare(
      `UPDATE users SET
        full_name = @fullName,
        phone = @phone,
        line1 = @line1,
        line2 = @line2,
        city = @city,
        region = @region,
        postal_code = @postalCode,
        country_code = @countryCode,
        updated_at = @now
      WHERE id = @id`,
    )
    .run({ ...data, id, now });
  if (result.changes === 0) return null;
  return getUserById(id);
}
