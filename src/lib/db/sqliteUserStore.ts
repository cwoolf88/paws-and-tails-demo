import { getDb, type UserRow } from "./client";
import { EmailTakenError, type UserStore } from "./userStore";

export function createSqliteUserStore(): UserStore {
  const getById = async (id: string) =>
    (getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined) ?? null;

  const getByEmail = async (email: string) =>
    (getDb().prepare("SELECT * FROM users WHERE lower(email) = ? LIMIT 1").get(email) as
      | UserRow
      | undefined) ?? null;

  return {
    async list() {
      return getDb().prepare("SELECT * FROM users ORDER BY full_name ASC").all() as UserRow[];
    },
    getById,
    getByEmail,
    async insert(row) {
      if (await getByEmail(row.email.toLowerCase())) throw new EmailTakenError();
      getDb()
        .prepare(
          `INSERT INTO users (
            id, email, full_name, password_hash, phone, line1, line2, city, region, postal_code, country_code, created_at, updated_at
          ) VALUES (
            @id, @email, @full_name, @password_hash, @phone, @line1, @line2, @city, @region, @postal_code, @country_code, @created_at, @updated_at
          )`,
        )
        .run(row);
    },
    async update(id, patch) {
      const result = getDb()
        .prepare(
          `UPDATE users SET
            full_name = @full_name,
            phone = @phone,
            line1 = @line1,
            line2 = @line2,
            city = @city,
            region = @region,
            postal_code = @postal_code,
            country_code = @country_code,
            updated_at = @updated_at
          WHERE id = @id`,
        )
        .run({ ...patch, id });
      if (result.changes === 0) return null;
      return getById(id);
    },
    async delete(id) {
      getDb().prepare("DELETE FROM users WHERE id = ?").run(id);
    },
  };
}
