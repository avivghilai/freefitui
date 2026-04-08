import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";
import * as schema from "./schema.js";

export function getDb() {
  const url = process.env.DATABASE_URL!;

  // Use Neon HTTP driver for neon.tech URLs (production),
  // standard postgres.js for local/other Postgres (dev)
  if (url.includes("neon.tech")) {
    const sql = neon(url);
    return drizzleNeon(sql, { schema });
  }

  const sql = postgres(url);
  return drizzlePg(sql, { schema });
}

export type Db = ReturnType<typeof getDb>;
