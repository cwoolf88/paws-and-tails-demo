import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "data", "paws-tails.db");

let dbInstance: Database.Database | null = null;

const BASE_USER_COLUMNS = [
  "id",
  "email",
  "full_name",
  "password_hash",
  "phone",
  "line1",
  "line2",
  "city",
  "region",
  "postal_code",
  "country_code",
  "created_at",
  "updated_at",
] as const;

function columnNames(database: Database.Database): Set<string> {
  const cols = database.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  return new Set(cols.map((c) => c.name));
}

function createUsersTable(database: Database.Database) {
  database.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      line1 TEXT NOT NULL DEFAULT '',
      line2 TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      region TEXT NOT NULL DEFAULT '',
      postal_code TEXT NOT NULL DEFAULT '',
      country_code TEXT NOT NULL DEFAULT 'US',
      owner_anemone_user_id TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      line1 TEXT NOT NULL DEFAULT '',
      line2 TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      region TEXT NOT NULL DEFAULT '',
      postal_code TEXT NOT NULL DEFAULT '',
      country_code TEXT NOT NULL DEFAULT 'US',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const names = columnNames(database);
  const missingBase = BASE_USER_COLUMNS.some((name) => !names.has(name));
  if (missingBase) {
    database.exec(`DROP TABLE IF EXISTS users`);
    createUsersTable(database);
    return;
  }

  if (!names.has("owner_anemone_user_id")) {
    database.exec(`ALTER TABLE users ADD COLUMN owner_anemone_user_id TEXT NOT NULL DEFAULT ''`);
  }
}

export function getDb() {
  if (dbInstance) return dbInstance;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  migrate(database);
  dbInstance = database;
  return database;
}

export type UserRow = {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal_code: string;
  country_code: string;
  /** Anemone staff user id that created this demo account; empty for legacy rows. */
  owner_anemone_user_id: string;
  created_at: string;
  updated_at: string;
};
