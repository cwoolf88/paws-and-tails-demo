import { getDb, type UserRow } from "./client";

export type PublicUser = {
  id: string;
  tenantId: string;
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
    tenantId: r.tenant_id,
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

export type UpdateUserInput = {
  fullName: string;
  email: string;
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
        email = @email,
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
