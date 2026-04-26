import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "data", "paws-tails.db");

let dbInstance: Database.Database | null = null;

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
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

function seedIfEmpty(database: Database.Database) {
  const n = database.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (n.c > 0) return;
  const now = new Date().toISOString();
  const tenant = process.env.NEXT_ADDRESS_TENANT_ID?.trim() || "demo-tenant";
  const ins = database.prepare(
    `INSERT INTO users (id, tenant_id, email, full_name, phone, line1, line2, city, region, postal_code, country_code, created_at, updated_at)
     VALUES (@id, @tenant_id, @email, @full_name, @phone, @line1, @line2, @city, @region, @postal_code, @country_code, @created_at, @updated_at)`,
  );
  const rows = [
    {
      id: "mews_wellington",
      email: "whiskers@example.com",
      full_name: "Whiskers Wellington",
      phone: "+15550001111",
      line1: "42 Scratching Post Lane",
      line2: "Apt. 2P",
      city: "Austin",
      region: "TX",
      postal_code: "78701",
    },
    {
      id: "bark_paulsen",
      email: "bark@example.com",
      full_name: "Bark Paulsen",
      phone: "+15550002222",
      line1: "7 Tail Wag Court",
      line2: "",
      city: "Portland",
      region: "OR",
      postal_code: "97201",
    },
  ];
  for (const r of rows) {
    ins.run({
      id: r.id,
      tenant_id: tenant,
      email: r.email,
      full_name: r.full_name,
      phone: r.phone,
      line1: r.line1,
      line2: r.line2,
      city: r.city,
      region: r.region,
      postal_code: r.postal_code,
      country_code: "US",
      created_at: now,
      updated_at: now,
    });
  }
}

export function getDb() {
  if (dbInstance) return dbInstance;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  migrate(database);
  seedIfEmpty(database);
  dbInstance = database;
  return database;
}

export type UserRow = {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
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
