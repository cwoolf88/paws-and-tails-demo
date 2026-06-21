import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "data", "paws-tails.db");

let dbInstance: Database.Database | null = null;

const EXPECTED_USER_COLUMNS = [
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

function usersTableSchemaOk(database: Database.Database) {
  const cols = database.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (cols.length === 0) return false;
  const names = new Set(cols.map((c) => c.name));
  return EXPECTED_USER_COLUMNS.every((name) => names.has(name)) && names.size === EXPECTED_USER_COLUMNS.length;
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

  if (!usersTableSchemaOk(database)) {
    database.exec(`DROP TABLE IF EXISTS users`);
    createUsersTable(database);
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
  created_at: string;
  updated_at: string;
};
