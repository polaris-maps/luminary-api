import { createClient, type InValue } from "@libsql/client";

// Locally this is a file called luminary.db. The team lead sets DATABASE_URL for production.
export const db = createClient({ url: process.env.DATABASE_URL ?? "file:luminary.db" });

// Run any SQL and get back the rows, typed as T.
// Works for SELECT, and for INSERT / UPDATE / DELETE ... RETURNING *.
export async function query<T>(sql: string, args: InValue[] = []): Promise<T[]> {
  const result = await db.execute({ sql, args });
  return result.rows as unknown as T[];
}

// Same as query, but for when you expect one row. Returns null if there is none.
export async function queryOne<T>(sql: string, args: InValue[] = []): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows[0] ?? null;
}
