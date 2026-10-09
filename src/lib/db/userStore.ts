import type { UserRow } from "./client";

export type UserRowPatch = Pick<
  UserRow,
  "full_name" | "phone" | "line1" | "line2" | "city" | "region" | "postal_code" | "country_code" | "updated_at"
>;

export class EmailTakenError extends Error {
  constructor() {
    super("An account with this email already exists.");
    this.name = "EmailTakenError";
  }
}

export type UserStore = {
  list(): Promise<UserRow[]>;
  getById(id: string): Promise<UserRow | null>;
  /** `email` must already be trimmed and lowercased. */
  getByEmail(email: string): Promise<UserRow | null>;
  /** Throws `EmailTakenError` when the email is already registered. */
  insert(row: UserRow): Promise<void>;
  update(id: string, patch: UserRowPatch): Promise<UserRow | null>;
  delete(id: string): Promise<void>;
};

/**
 * Hosted Amplify environments have a read-only, per-instance filesystem, so they
 * use the per-env DynamoDB table (`PawsDemoDataStack`). Local dev keeps SQLite.
 */
export function usersTableName(): string | null {
  const explicit = process.env.PAWS_USERS_TABLE?.trim();
  if (explicit) return explicit;
  const prefix = process.env.PAWS_USERS_TABLE_PREFIX?.trim();
  const appEnv = process.env.APP_ENV?.trim();
  return prefix && appEnv ? `${prefix}${appEnv}` : null;
}

let storePromise: Promise<UserStore> | null = null;

export function getUserStore(): Promise<UserStore> {
  if (!storePromise) {
    const table = usersTableName();
    storePromise = table
      ? import("./dynamoUserStore").then((m) => m.createDynamoUserStore(table))
      : import("./sqliteUserStore").then((m) => m.createSqliteUserStore());
  }
  return storePromise;
}
